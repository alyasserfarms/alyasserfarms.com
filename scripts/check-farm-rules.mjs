import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';
const require = createRequire(import.meta.url);
const cache = new Map();
function load(relative) {
  const filename = path.resolve(relative);
  if (cache.has(filename)) return cache.get(filename);
  const exports = {}; cache.set(filename, exports);
  const code = ts.transpileModule(readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { exports, require(name) {
    if (name.startsWith('@/')) return load(`src/${name.slice(2)}.ts`);
    if (name.startsWith('.')) return load(path.resolve(path.dirname(filename), `${name}.ts`));
    return require(name);
  } }); return exports;
}
const rules = load('src/lib/farm-rules.ts');
const { isAvailable } = load('src/data/farm-types.ts');
const product = rules.cleanProduct({ name: 'صنف اختبار', category: 'meat', image: 'beef', status: 'available', sale: 'kg', stock: 30, minimum: 1, price: 100 });
const store = { revision: 0, products: [product], settings: { receiveOrders: true, minimumBulkKg: 24 }, orders: [] };
const customer = { name: 'عميل اختبار', phone: '01000000000', city: 'منطقة اختبار', address: 'عنوان تجريبي للاختبار فقط' };
const input = (quantity, kind = 'retail') => ({ key: require('node:crypto').randomUUID(), customer, items: [{ id: product.id, quantity, price: 1 }], kind });
assert.throws(() => rules.cleanProduct({ ...product, image: '../../private' }));
assert.throws(() => rules.cleanProduct({ ...product, price: -1 }));
assert.throws(() => rules.createOrder(store, input(23, 'bulk')));
const raw = input(24, 'bulk'); const order = rules.createOrder(store, raw);
assert.equal(order.total, 2400); // Server prices, ignoring client-supplied price.
assert.equal(rules.createOrder(store, raw).id, order.id);
assert.equal(store.orders.length, 1);
assert.equal(product.stock, 30); // Submission alone does not reserve stock.
assert.throws(() => rules.updateOrder(store, order.id, 'confirmed'));
rules.updateOrder(store, order.id, 'reviewed'); rules.updateOrder(store, order.id, 'confirmed');
assert.equal(product.stock, 6);
assert.throws(() => rules.createOrder(store, input(7)));
rules.updateOrder(store, order.id, 'cancelled'); assert.equal(product.stock, 30);
assert.throws(() => rules.updateOrder(store, order.id, 'confirmed'));
product.status = 'hidden'; assert.equal(isAvailable(product), false);
assert.throws(() => rules.createOrder(store, input(1)));
product.status = 'available'; store.settings.receiveOrders = false;
assert.throws(() => rules.createOrder(store, input(1)));
store.settings.receiveOrders = true;
product.sale = 'head'; product.unit = 'رأس';
assert.throws(() => rules.createOrder(store, input(24, 'bulk')));
assert.equal(rules.createOrder(store, input(1)).items[0].unit, 'رأس');
console.log('Farm rules passed: validation, visibility, server pricing, idempotency, wholesale scope, transitions, reservation and cancellation.');
