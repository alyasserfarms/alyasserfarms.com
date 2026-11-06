import "server-only";
import { type PoolClient } from "pg";
import { isAvailable, type FarmOrder, type FarmProduct, type FarmSettings, type FarmStore, type PriceChange, type PublicFarm, type FarmUser, type FarmUserRole } from "@/data/farm-types";
import { createFarmPool } from "./postgres-pool";
import { collectPriceChanges } from "./farm-rules";

const pool = createFarmPool(2);

type Queryable = Pick<PoolClient, "query">;
type ProductRow = { id: string; name: string; category: FarmProduct["category"]; image: string; unit: string; sale: FarmProduct["sale"]; price: string; description: string; preparation: string; stock: number; minimum: number; status: FarmProduct["status"] };
type SettingsRow = { minimum_bulk_kg: number; eid: boolean; receive_orders: boolean; delivery: string };
type OrderRow = { id: string; idempotency_key: string; created_at: Date; status: FarmOrder["status"]; customer_name: string; customer_phone: string; customer_city: string; customer_address: string; customer_notes: string; kind: FarmOrder["kind"]; total: string; reserved: boolean; delivery_fee: string | null; delivery_date: string | null; delivery_agent: string; delivery_note: string };
type OrderItemRow = { order_id: string; product_id: string; name: string; unit: string; quantity: number; price: string };
type PriceRow = { id: string; product_id: string; product_name: string; unit: string; old_price: string; new_price: string; occurred_at: Date };

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
  const prices = await client.query<PriceRow>("select id,product_id,product_name,unit,old_price,new_price,occurred_at from farm.price_changes order by occurred_at desc,id desc limit 100");
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
    priceHistory: prices.rows.map((row): PriceChange => ({ id: row.id, productId: row.product_id, productName: row.product_name, unit: row.unit, before: Number(row.old_price), after: Number(row.new_price), occurredAt: row.occurred_at.toISOString() })),
    orders: orders.rows.map(row => ({ id: row.id, key: row.idempotency_key, createdAt: row.created_at.toISOString(), status: row.status, customer: { name: row.customer_name, phone: row.customer_phone, city: row.customer_city, address: row.customer_address, notes: row.customer_notes }, items: byOrder.get(row.id) ?? [], total: Number(row.total), kind: row.kind, reserved: row.reserved, delivery: { fee: row.delivery_fee === null ? null : Number(row.delivery_fee), date: row.delivery_date ?? "", agent: row.delivery_agent, note: row.delivery_note } })),
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
export async function readPostgresFarm(): Promise<FarmStore> { return transaction(loadFarm, true); }
export async function publicPostgresFarm(): Promise<PublicFarm> {
  const store = await readPostgresFarm();
  return { products: store.products.filter(isAvailable), settings: store.settings };
}
export async function changePostgresFarm<T>(change: (store: FarmStore) => T | Promise<T>): Promise<T> {
  return transaction(async (client) => {
    await client.query("select pg_advisory_xact_lock(7429184)");
    const store = await loadFarm(client);
    const before = store.products.map(product => ({ ...product }));
    const result = await change(store);
    const priceChanges = collectPriceChanges(before, store.products);
    store.revision++;
    await client.query("update farm.settings set minimum_bulk_kg=$1,eid=$2,receive_orders=$3,delivery=$4 where id=1",
      [store.settings.minimumBulkKg, store.settings.eid, store.settings.receiveOrders, store.settings.delivery]);
    await client.query("update farm.revision set value=$1 where id=1", [store.revision]);
    const incomingIds = new Set(store.products.map(product => product.id));
    if (incomingIds.size) await client.query("delete from farm.products where id not in (select unnest($1::text[]))", [Array.from(incomingIds)]);
    else await client.query("delete from farm.products");
    for (const [index, item] of store.products.entries()) {
      await client.query(`insert into farm.products (id,name,category,image,unit,sale,price,description,preparation,stock,minimum,status,sort_order)
        values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
        on conflict (id) do update set name=excluded.name,category=excluded.category,image=excluded.image,unit=excluded.unit,sale=excluded.sale,price=excluded.price,description=excluded.description,preparation=excluded.preparation,stock=excluded.stock,minimum=excluded.minimum,status=excluded.status,sort_order=excluded.sort_order`,
      [item.id, item.name, item.category, item.image, item.unit, item.sale, item.price, item.description, item.preparation, item.stock, item.minimum, item.status, index]);
    }
    for (const event of priceChanges) await client.query("insert into farm.price_changes (id,product_id,product_name,unit,old_price,new_price,occurred_at) values ($1,$2,$3,$4,$5,$6,$7)", [event.id, event.productId, event.productName, event.unit, event.before, event.after, event.occurredAt]);
    const orderIds = new Set(store.orders.map(order => order.id));
    if (orderIds.size) await client.query("delete from farm.orders where id not in (select unnest($1::text[]))", [Array.from(orderIds)]);
    else await client.query("delete from farm.orders");
    for (const order of store.orders) {
      await client.query(`insert into farm.orders (id,idempotency_key,created_at,status,customer_name,customer_phone,customer_city,customer_address,customer_notes,kind,total,reserved,delivery_fee,delivery_date,delivery_agent,delivery_note)
        values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
        on conflict (id) do update set idempotency_key=excluded.idempotency_key,created_at=excluded.created_at,status=excluded.status,customer_name=excluded.customer_name,customer_phone=excluded.customer_phone,customer_city=excluded.customer_city,customer_address=excluded.customer_address,customer_notes=excluded.customer_notes,kind=excluded.kind,total=excluded.total,reserved=excluded.reserved,delivery_fee=excluded.delivery_fee,delivery_date=excluded.delivery_date,delivery_agent=excluded.delivery_agent,delivery_note=excluded.delivery_note`,
      [order.id, order.key, new Date(order.createdAt), order.status, order.customer.name, order.customer.phone, order.customer.city, order.customer.address, order.customer.notes, order.kind, order.total, order.reserved, order.delivery?.fee ?? null, order.delivery?.date || null, order.delivery?.agent ?? "", order.delivery?.note ?? ""]);
      await client.query("delete from farm.order_items where order_id=$1", [order.id]);
      for (const [index, item] of order.items.entries()) {
        await client.query("insert into farm.order_items (order_id,line_number,product_id,name,unit,quantity,price) values ($1,$2,$3,$4,$5,$6,$7)",
          [order.id, index, item.id, item.name, item.unit, item.quantity, item.price]);
      }
    }
    return result;
  });
}

type DbUserRow = {
  id: string;
  username: string;
  name: string;
  password_hash: string;
  role: FarmUserRole;
  active: boolean;
  created_at: Date;
};

export async function getUserByUsername(username: string): Promise<DbUserRow | null> {
  try {
    return await transaction(async (client) => {
      const res = await client.query<DbUserRow>(
        "select id, username, name, password_hash, role, active, created_at from farm.users where lower(username) = lower($1)",
        [username.trim()]
      );
      return res.rows[0] ?? null;
    }, true);
  } catch {
    return null;
  }
}

export async function getUserById(id: string): Promise<DbUserRow | null> {
  try {
    return await transaction(async (client) => {
      const res = await client.query<DbUserRow>(
        "select id, username, name, password_hash, role, active, created_at from farm.users where id = $1",
        [id]
      );
      return res.rows[0] ?? null;
    }, true);
  } catch {
    return null;
  }
}

export async function listFarmUsers(): Promise<FarmUser[]> {
  try {
    return await transaction(async (client) => {
      const res = await client.query<DbUserRow>(
        "select id, username, name, password_hash, role, active, created_at from farm.users order by role asc, created_at asc"
      );
      return res.rows.map(r => ({
        id: r.id,
        username: r.username,
        name: r.name,
        role: r.role,
        active: r.active,
        createdAt: r.created_at.toISOString(),
      }));
    }, true);
  } catch {
    return [];
  }
}

export async function createFarmUser(username: string, name: string, passwordHash: string, role: FarmUserRole): Promise<FarmUser> {
  return await transaction(async (client) => {
    const res = await client.query<DbUserRow>(
      "insert into farm.users (username, name, password_hash, role) values ($1, $2, $3, $4) returning id, username, name, password_hash, role, active, created_at",
      [username.trim(), name.trim(), passwordHash, role]
    );
    const r = res.rows[0];
    return {
      id: r.id,
      username: r.username,
      name: r.name,
      role: r.role,
      active: r.active,
      createdAt: r.created_at.toISOString(),
    };
  });
}

export async function updateFarmUserPassword(id: string, passwordHash: string): Promise<void> {
  await transaction(async (client) => {
    await client.query("update farm.users set password_hash = $1, updated_at = now() where id = $2", [passwordHash, id]);
  });
}

export async function updateFarmUserRole(id: string, role: FarmUserRole): Promise<void> {
  await transaction(async (client) => {
    await client.query("update farm.users set role = $1, updated_at = now() where id = $2", [role, id]);
  });
}

export async function setFarmUserActive(id: string, active: boolean): Promise<void> {
  await transaction(async (client) => {
    await client.query("update farm.users set active = $1, updated_at = now() where id = $2", [active, id]);
  });
}

export async function deleteFarmUser(id: string): Promise<void> {
  await transaction(async (client) => {
    await client.query("delete from farm.users where id = $1", [id]);
  });
}

export async function getAdminPasswordHash(): Promise<string | null> {
  try {
    return await transaction(async (client) => {
      const res = await client.query<{ admin_password_hash: string | null }>(
        "select admin_password_hash from farm.settings where id = 1"
      );
      return res.rows[0]?.admin_password_hash ?? null;
    }, true);
  } catch {
    return null;
  }
}

export async function setAdminPasswordHash(hash: string): Promise<void> {
  await transaction(async (client) => {
    await client.query("update farm.settings set admin_password_hash = $1 where id = 1", [hash]);
  });
}
