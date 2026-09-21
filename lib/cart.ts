"use client";

import { useSyncExternalStore } from "react";

/**
 * Panier côté navigateur : { slug: quantité }. La commande, elle, part en base
 * via l'action `checkout`. Passera en table `carts` si on veut le retrouver
 * d'un appareil à l'autre.
 */

const STORAGE_KEY = "mb.cart.v1";
type Cart = Record<string, number>;

let cart: Cart = {};
let loaded = false;
const listeners = new Set<() => void>();
const EMPTY: Cart = {};

function emit() {
  for (const l of listeners) l();
}

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      cart = JSON.parse(raw) as Cart;
      emit();
    }
  } catch {
    // stockage indisponible : panier volatile
  }
}

function set(next: Cart) {
  cart = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // idem
  }
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  load();
  return () => {
    listeners.delete(listener);
  };
}

export function addToCart(slug: string, qty = 1) {
  set({ ...cart, [slug]: (cart[slug] ?? 0) + qty });
}

export function setQty(slug: string, qty: number) {
  const next = { ...cart };
  if (qty > 0) next[slug] = qty;
  else delete next[slug];
  set(next);
}

export function removeFromCart(slug: string) {
  setQty(slug, 0);
}

export function clearCart() {
  set({});
}

export function useCart() {
  const items = useSyncExternalStore(
    subscribe,
    () => cart,
    () => EMPTY,
  );
  const list = Object.entries(items).map(([slug, qty]) => ({ slug, qty }));
  return {
    items,
    list,
    count: list.reduce((n, i) => n + i.qty, 0),
    addToCart,
    setQty,
    removeFromCart,
    clearCart,
  };
}
