import "server-only";
import { Pool, type PoolClient } from "pg";
import { isAvailable, type FarmOrder, type FarmProduct, type FarmSettings, type FarmStore, type PublicFarm } from "@/data/farm-types";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required for the PostgreSQL adapter.");
const pool = new Pool({ connectionString, max: 5, connectionTimeoutMillis: 10000, idleTimeoutMillis: 30000 });

type Queryable = Pick<PoolClient, "query">;
type ProductRow = { id: string; name: string; category: FarmProduct["category"]; image: string; unit: string; sale: FarmProduct["sale"]; price: string; description: string; preparation: string; stock: number; minimum: number; status: FarmProduct["status"] };
type SettingsRow = { minimum_bulk_kg: number; eid: boolean; receive_orders: boolean; delivery: string };
type OrderRow = { id: string; idempotency_key: string; created_at: Date; status: FarmOrder["status"]; customer_name: string; customer_phone: string; customer_city: string; customer_address: string; customer_notes: string; kind: FarmOrder["kind"]; total: string; reserved: boolean };
type OrderItemRow = { order_id: string; product_id: string; name: string; unit: string; quantity: number; price: string };

function productFromRow(row: ProductRow): FarmProduct {
  return { id: row.id, name: row.name, category: row.category, image: row.image, unit: row.unit, sale: row.sale, price: Number(row.price), description: row.description, preparation: row.preparation, stock: row.stock, minimum: row.minimum, status: row.status };
}
function settingsFromRow(row: SettingsRow): FarmSettings {
  return { minimumBulkKg: row.minimum_bulk_kg, eid: row.eid, receiveOrders: row.receive_orders, delivery: row.delivery };
}
async function loadFarm(client: Queryable): Promise<FarmStore> {
  const revision = await client.query<{ value: string }>("select value from farm.revision where id = 1");
  const settings = await client.query<SettingsRow>("select minimum_bulk_kg, eid, receive_orders, delivery from farm.settings where id = 1");
  if (!revision.rows[0] || !settings.rows[0]) throw new Error("Farm database is not initialized. Apply the schema and import data first.");
  const products = await client.query<ProductRow>("select * from farm.products order by sort_order, id");
  const orders = await client.query<OrderRow>("select * from farm.orders order by created_at desc, id desc");
  const lines = await client.query<OrderItemRow>("select * from farm.order_items order by order_id, line_number");
  const byOrder = new Map<string, FarmOrder["items"]>();
  for (const line of lines.rows) {
    const list = byOrder.get(line.order_id) ?? [];
    list.push({ id: line.product_id, name: line.name, unit: line.unit, quantity: line.quantity, price: Number(line.price) });
    byOrder.set(line.order_id, list);
  }
  return {
    revision: Number(revision.rows[0].value),
    settings: settingsFromRow(settings.rows[0]),
    products: products.rows.map(productFromRow),
    orders: orders.rows.map(row => ({ id: row.id, key: row.idempotency_key, createdAt: row.created_at.toISOString(), status: row.status, customer: { name: row.customer_name, phone: row.customer_phone, city: row.customer_city, address: row.customer_address, notes: row.customer_notes }, items: byOrder.get(row.id) ?? [], total: Number(row.total), kind: row.kind, reserved: row.reserved })),
  };
}
async function transaction<T>(work: (client: PoolClient) => Promise<T>, readOnly = false): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query(readOnly ? "begin isolation level repeatable read read only" : "begin");
    const result = await work(client);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback").catch(() => {});
    throw error;
  } finally { client.release(); }
}

export function readPostgresFarm(): Promise<FarmStore> { return transaction(loadFarm, true); }
export async function publicPostgresFarm(): Promise<PublicFarm> {
  return transaction(async client => {
    const settings = await client.query<SettingsRow>("select minimum_bulk_kg, eid, receive_orders, delivery from farm.settings where id = 1");
    if (!settings.rows[0]) throw new Error("Farm database is not initialized.");
    const products = await client.query<ProductRow>("select * from farm.products where status = 'available' and stock >= minimum order by sort_order, id");
    return { settings: settingsFromRow(settings.rows[0]), products: products.rows.map(productFromRow).filter(isAvailable) };
  }, true);
}

async function saveProduct(client: Queryable, product: FarmProduct, sortOrder: number) {
  await client.query(`insert into farm.products (id,name,category,image,unit,sale,price,description,preparation,stock,minimum,status,sort_order)
    values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
    on conflict (id) do update set name=excluded.name, category=excluded.category, image=excluded.image, unit=excluded.unit,
    sale=excluded.sale, price=excluded.price, description=excluded.description, preparation=excluded.preparation,
    stock=excluded.stock, minimum=excluded.minimum, status=excluded.status, sort_order=excluded.sort_order`,
  [product.id, product.name, product.category, product.image, product.unit, product.sale, product.price, product.description, product.preparation, product.stock, product.minimum, product.status, sortOrder]);
}
async function saveOrder(client: Queryable, order: FarmOrder, isNew: boolean) {
  await client.query(`insert into farm.orders (id,idempotency_key,created_at,status,customer_name,customer_phone,customer_city,customer_address,customer_notes,kind,total,reserved)
    values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    on conflict (id) do update set status=excluded.status, reserved=excluded.reserved`,
  [order.id, order.key, order.createdAt, order.status, order.customer.name, order.customer.phone, order.customer.city, order.customer.address, order.customer.notes, order.kind, order.total, order.reserved]);
  if (isNew) for (const [index, item] of order.items.entries()) {
    await client.query("insert into farm.order_items (order_id,line_number,product_id,name,unit,quantity,price) values ($1,$2,$3,$4,$5,$6,$7)", [order.id, index, item.id, item.name, item.unit, item.quantity, item.price]);
  }
}
export async function changePostgresFarm<T>(change: (store: FarmStore) => T | Promise<T>): Promise<T> {
  return transaction(async client => {
    // Every writer takes this row lock. Orders, stock and settings commit together across server processes.
    await client.query("select value from farm.revision where id = 1 for update");
    const store = await loadFarm(client);
    const before = structuredClone(store);
    const result = await change(store);
    const oldProducts = new Map(before.products.map((item, index) => [item.id, { item, index }]));
    for (const [index, product] of store.products.entries()) {
      const old = oldProducts.get(product.id);
      if (!old || old.index !== index || JSON.stringify(old.item) !== JSON.stringify(product)) await saveProduct(client, product, index);
    }
    if (JSON.stringify(before.settings) !== JSON.stringify(store.settings)) await client.query("update farm.settings set minimum_bulk_kg=$1,eid=$2,receive_orders=$3,delivery=$4 where id=1", [store.settings.minimumBulkKg, store.settings.eid, store.settings.receiveOrders, store.settings.delivery]);
    const oldOrders = new Map(before.orders.map(order => [order.id, order]));
    for (const order of store.orders) {
      const old = oldOrders.get(order.id);
      if (!old || JSON.stringify(old) !== JSON.stringify(order)) await saveOrder(client, order, !old);
    }
    await client.query("update farm.revision set value=value+1 where id=1");
    return result;
  });
}
