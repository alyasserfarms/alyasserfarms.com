"use client";
import { useFarm } from "@/components/farm-provider";

import { useSyncExternalStore } from "react";

export const CART_STORAGE_KEY = "alyasser.cart.v1";
export const MAX_QUANTITY = 99;
type Cart = Record<string, number>;
const empty: Cart = {};
const changed = "alyasser:cart-changed";
let snapshot: Cart = empty;
let serialized: string | null | undefined;
let memoryOnly = false;

function parseCart(raw: string | null): Cart {
  if (!raw) return empty;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) return empty;
    const valid: Cart = {};
    for (const [id, quantity] of Object.entries(value)) {
      if (!/^[a-z0-9-]{1,80}$/.test(id)) continue;
      if (typeof quantity === "number" && Number.isInteger(quantity) && quantity > 0) valid[id] = Math.min(quantity, MAX_QUANTITY);
    }
    return valid;
  } catch { return empty; }
}

function getSnapshot(): Cart {
  if (memoryOnly) return snapshot;
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (raw !== serialized) { serialized = raw; snapshot = parseCart(raw); }
  } catch { memoryOnly = true; }
  return snapshot;
}

function subscribe(callback: () => void) {
  window.addEventListener(changed, callback);
  window.addEventListener("storage", callback);
  return () => { window.removeEventListener(changed, callback); window.removeEventListener("storage", callback); };
}

function update(transform: (cart: Cart) => Cart) {
  const next = transform(getSnapshot());
  snapshot = next;
  serialized = JSON.stringify(next);
  try { if (!memoryOnly) window.localStorage.setItem(CART_STORAGE_KEY, serialized); }
  catch { memoryOnly = true; }
  window.dispatchEvent(new Event(changed));
}

export function useCart() {
  const { products } = useFarm();
  const cart = useSyncExternalStore(subscribe, getSnapshot, () => empty);
  const ready = useSyncExternalStore(subscribe, () => true, () => false);
  const items = products.filter((product) => cart[product.id]).map((product) => ({ product, quantity: cart[product.id] }));
  const invalidIds = Object.keys(cart).filter(id => !products.some(product => product.id === id));
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  function setQuantity(id: string, quantity: number) {
    if (!products.some((product) => product.id === id) || !Number.isFinite(quantity)) return;
    update((current) => {
      const next = { ...current };
      if (quantity <= 0) delete next[id];
      else next[id] = Math.min(MAX_QUANTITY, Math.floor(quantity));
      return next;
    });
  }

  function add(id: string, quantity?: number) {
    quantity ??= products.find(product => product.id === id)?.minimum ?? 1;
    if (!products.some((product) => product.id === id) || !Number.isInteger(quantity) || quantity < 1) return false;
    const product = products.find(product => product.id === id)!;
    if (quantity < product.minimum) return false;
    const previous = getSnapshot()[id] ?? 0;
    if (previous + quantity > Math.min(MAX_QUANTITY, products.find(product => product.id === id)?.stock ?? MAX_QUANTITY)) return false;
    setQuantity(id, previous + quantity);
    return true;
  }

  return { cart, items, invalidIds, count, total, ready, add, setQuantity, remove: (id: string) => update(current => { const next = { ...current }; delete next[id]; return next; }), storageAvailable: !memoryOnly };
}
