import { Client } from 'pg';
import { readFile, copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const source = path.resolve('data/farm.json');
const store = JSON.parse(await readFile(source, 'utf8'));
if (!Array.isArray(store.products) || !Array.isArray(store.orders) || !store.settings || !Number.isSafeInteger(store.revision)) throw new Error('Local farm.json has an unexpected shape. No data was imported.');
const ids = new Set(store.products.map(product => product.id));
if (ids.size !== store.products.length || store.orders.some(order => order.items.some(item => !ids.has(item.id)))) throw new Error('Duplicate product IDs or orphan order items. No data was imported.');
console.log(`Local source: ${store.products.length} products, ${store.orders.length} orders, revision ${store.revision}.`);
if (!process.argv.includes('--apply')) { console.log('Dry run only. Set DATABASE_URL and use --apply to import into an empty database.'); process.exit(0); }
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required. Do not paste it into source files.');
const backupDirectory = path.resolve('data/backups');
await mkdir(backupDirectory, { recursive: true });
const backup = path.join(backupDirectory, `farm-before-postgres-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
await copyFile(source, backup);
const client = new Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 10000 });
await client.connect();
try {
  await client.query(await readFile('db/001_farm_schema.sql', 'utf8'));
  await client.query('begin');
  const revision = await client.query('select value from farm.revision where id=1 for update');
  const products = await client.query('select count(*)::int as count from farm.products');
  const orders = await client.query('select count(*)::int as count from farm.orders');
  if (products.rows[0].count || orders.rows[0].count || Number(revision.rows[0].value)) throw new Error('Target already contains farm data. Import cancelled to protect it.');
  for (const [index, item] of store.products.entries()) {
    await client.query(`insert into farm.products (id,name,category,image,unit,sale,price,description,preparation,stock,minimum,status,sort_order)
      values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
    [item.id,item.name,item.category,item.image,item.unit,item.sale,item.price,item.description,item.preparation,item.stock,item.minimum,item.status,index]);
  }
  const settings = store.settings;
  await client.query('update farm.settings set minimum_bulk_kg=$1,eid=$2,receive_orders=$3,delivery=$4 where id=1', [settings.minimumBulkKg,settings.eid,settings.receiveOrders,settings.delivery]);
  for (const order of store.orders) {
    await client.query(`insert into farm.orders (id,idempotency_key,created_at,status,customer_name,customer_phone,customer_city,customer_address,customer_notes,kind,total,reserved)
      values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    [order.id,order.key,order.createdAt,order.status,order.customer.name,order.customer.phone,order.customer.city,order.customer.address,order.customer.notes,order.kind,order.total,order.reserved]);
    for (const [index, item] of order.items.entries()) await client.query('insert into farm.order_items (order_id,line_number,product_id,name,unit,quantity,price) values ($1,$2,$3,$4,$5,$6,$7)', [order.id,index,item.id,item.name,item.unit,item.quantity,item.price]);
  }
  await client.query('update farm.revision set value=$1 where id=1', [store.revision]);
  await client.query('commit');
  const check = await client.query('select (select count(*)::int from farm.products) as products, (select count(*)::int from farm.orders) as orders');
  if (check.rows[0].products !== store.products.length || check.rows[0].orders !== store.orders.length) throw new Error('Import counts did not match. Inspect target before using it.');
  console.log(`Import verified. Local backup: ${backup}`);
} catch (error) { await client.query('rollback').catch(() => {}); throw error; }
finally { await client.end(); }
