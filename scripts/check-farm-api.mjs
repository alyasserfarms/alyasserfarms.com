import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
const base = 'http://127.0.0.1:3002'; // Isolated QA server; never run against the live adapter.
const password = readFileSync('.env.local', 'utf8').match(/^ADMIN_PASSWORD=(.+)$/m)?.[1].trim();
let cookie = '';
async function request(route, method = 'GET', value, authenticated = true, origin = base) {
  const response = await fetch(base + route, { method, headers: { Origin: origin, ...(cookie && authenticated ? { Cookie: cookie } : {}), ...(value ? { 'Content-Type': 'application/json' } : {}) }, ...(value ? { body: JSON.stringify(value) } : {}) });
  const data = await response.json().catch(() => null); return { response, data };
}
assert.equal((await request('/api/admin', 'GET', null, false)).response.status, 401);
const form = new FormData(); form.set('password', password);
const login = await fetch(base + '/api/admin/session', { method: 'POST', headers: { Origin: base }, body: form });
assert.equal(login.status, 200); cookie = login.headers.get('set-cookie').split(';')[0];
let { data: store } = await request('/api/admin');
const product = { ...store.products[0], id: randomUUID(), name: 'صنف اختبار التكامل', sale: 'kg', price: 100, stock: 30, minimum: 1, status: 'available' };
let result = await request('/api/admin', 'POST', { action: 'product', product, revision: store.revision });
assert.equal(result.response.status, 200); store = result.data;
assert.ok((await request('/api/catalogue')).data.products.some(item => item.id === product.id));
assert.equal((await request('/api/admin', 'POST', { action: 'settings', revision: store.revision, settings: store.settings }, true, 'https://untrusted.example')).response.status, 403);
assert.equal((await request('/api/admin', 'POST', { action: 'product', product, revision: store.revision - 1 })).response.status, 400);
result = await request('/api/admin', 'POST', { action: 'product', product: { ...product, status: 'hidden' }, revision: store.revision }); store = result.data;
assert.ok(!(await request('/api/catalogue')).data.products.some(item => item.id === product.id));
result = await request('/api/admin', 'POST', { action: 'product', product, revision: store.revision }); store = result.data;
const customer = { name: 'عميل اختبار التكامل', phone: '01000000000', city: 'منطقة اختبار', address: 'عنوان تجريبي فقط لاختبار الطلب' };
const body = { key: randomUUID(), customer, items: [{ id: product.id, quantity: 24, price: 1 }], kind: 'bulk' };
const order = (await request('/api/orders', 'POST', body, false)).data;
assert.equal(order.total, 2400);
assert.equal((await request('/api/orders', 'POST', body, false)).data.reference, order.reference);
store = (await request('/api/admin')).data;
assert.equal(store.products.find(item => item.id === product.id).stock, 30);
for (const status of ['reviewed', 'confirmed']) { result = await request('/api/admin', 'POST', { action: 'order', id: order.reference, status, revision: store.revision }); assert.equal(result.response.status, 200); store = result.data; }
assert.equal(store.products.find(item => item.id === product.id).stock, 6);
const second = await request('/api/orders', 'POST', { ...body, key: randomUUID(), items: [{ id: product.id, quantity: 7 }], kind: 'retail' }, false);
assert.equal(second.response.status, 400);
result = await request('/api/admin', 'POST', { action: 'order', id: order.reference, status: 'cancelled', revision: store.revision }); store = result.data;
assert.equal(store.products.find(item => item.id === product.id).stock, 30);
const publicData = (await request('/api/catalogue')).data;
assert.equal(Object.hasOwn(publicData, 'orders'), false);
assert.equal(JSON.stringify(publicData).includes(customer.phone), false);
result = await request('/api/admin', 'POST', { action: 'settings', settings: { ...store.settings, receiveOrders: false }, revision: store.revision }); store = result.data;
assert.equal((await request('/api/orders', 'POST', { ...body, key: randomUUID() }, false)).response.status, 400);
result = await request('/api/admin', 'POST', { action: 'settings', settings: { ...store.settings, receiveOrders: true }, revision: store.revision }); store = result.data;
await request('/api/admin', 'POST', { action: 'product', product: { ...product, status: 'hidden' }, revision: store.revision });
assert.equal((await request('/api/admin', 'GET', null, false)).response.status, 401);
console.log('API integration passed: auth, CSRF, revision conflicts, availability, order submission/deduplication, server totals, stock reservation/cancellation and private data separation.');
