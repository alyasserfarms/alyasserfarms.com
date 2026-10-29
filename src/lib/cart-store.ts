"use client";

import { useSyncExternalStore } from "react";
import { products } from "@/data/content";

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
    for (const product of products) {
      const quantity = (value as Record<string, unknown>)[product.id];
      if (typeof quantity === "number" && Number.isInteger(quantity) && quantity > 0) valid[product.id] = Math.min(quantity, MAX_QUANTITY);
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
  const cart = useSyncExternalStore(subscribe, getSnapshot, () => empty);
  const ready = useSyncExternalStore(subscribe, () => true, () => false);
  const items = products.filter((product) => cart[product.id]).map((product) => ({ product, quantity: cart[product.id] }));
  const count = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);
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

  function add(id: string, quantity = 1) {
    if (!products.some((product) => product.id === id) || !Number.isInteger(quantity) || quantity < 1) return false;
    const previous = getSnapshot()[id] ?? 0;
    if (previous + quantity > MAX_QUANTITY) return false;
    setQuantity(id, previous + quantity);
    return true;
  }

  return { cart, items, count, total, ready, add, setQuantity, remove: (id: string) => setQuantity(id, 0), storageAvailable: !memoryOnly };
}
