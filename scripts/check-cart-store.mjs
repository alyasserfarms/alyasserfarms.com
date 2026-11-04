import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source = readFileSync(new URL('../src/lib/cart-store.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function createStore(initial, unavailable = false) {
  let stored = initial ?? null;
  const window = new EventTarget();
  window.localStorage = {
    getItem() { if (unavailable) throw new Error('Storage unavailable'); return stored; },
    setItem(_key, value) { if (unavailable) throw new Error('Storage unavailable'); stored = value; },
  };
  const exports = {};
  vm.runInNewContext(compiled, {
    exports, window, Event,
    require(name) {
      if (name === 'react') return { useSyncExternalStore: (_subscribe, getSnapshot) => getSnapshot() };
      if (name === '@/components/farm-provider') return { useFarm: () => ({ products: [{ id: 'tomatoes', price: 25, minimum: 1, stock: 99 }, { id: 'beef', price: 85, minimum: 1, stock: 99 }] }) };
      throw new Error(`Unexpected import: ${name}`);
    },
  });
  return exports.useCart;
}

const cart = createStore();
assert.equal(cart().add('missing'), false);
for (const quantity of [0, -1, 1.5, NaN, Infinity]) assert.equal(cart().add('tomatoes', quantity), false);
assert.equal(cart().add('tomatoes', 98), true);
assert.equal(cart().add('tomatoes', 2), false);
assert.equal(cart().count, 98);
assert.equal(cart().add('tomatoes'), true);
assert.equal(cart().count, 99);
assert.equal(cart().total, 2475);
assert.equal(cart().add('tomatoes'), false);
cart().remove('tomatoes');
assert.equal(cart().count, 0);

assert.equal(createStore('{broken')().count, 0);
assert.equal(createStore(JSON.stringify({ tomatoes: 150, beef: -2, unknown: 10 }))().count, 99);
const memory = createStore(null, true);
assert.equal(memory().add('beef', 2), true);
assert.equal(memory().count, 2);
assert.equal(memory().storageAvailable, false);
console.log('Cart checks passed: validation, limits, totals, removal, stored data and storage fallback.');
