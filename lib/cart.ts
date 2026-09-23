"use client";

import { useSyncExternalStore } from "react";

/**
 * Panier côté navigateur : { clé: quantité }. La commande, elle, part en base
 * via l'action `checkout`. Passera en table `carts` si on veut le retrouver
 * d'un appareil à l'autre.
 *
 * La clé est l'adresse de l'article, éventuellement suivie de la déclinaison
 * choisie : « puff-mangue » ou « puff-mangue::<id de la saveur> ». Deux
 * saveurs du même article sont deux lignes — c'est ce qu'attend celui qui
 * commande une mangue et une menthe, et c'est aussi ce qu'attend le stock.
 */

const STORAGE_KEY = "mb.cart.v1";
const MODE_KEY = "mb.cart.mode.v1";
type Cart = Record<string, number>;

/** Comment on récupère sa commande : au comptoir, ou chez soi. */
export type Recuperation = "pickup" | "delivery";

let cart: Cart = {};
let mode: Recuperation = "pickup";
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
    if (raw) cart = JSON.parse(raw) as Cart;
    const gard = window.localStorage.getItem(MODE_KEY);
    if (gard === "delivery" || gard === "pickup") mode = gard;
    if (raw || gard) emit();
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

/** « slug » ou « slug::variante » — une seule façon de nommer une ligne. */
export function cleArticle(slug: string, variantId?: string | null): string {
  return variantId ? `${slug}::${variantId}` : slug;
}

/** L'inverse : ce que la clé désigne. */
export function lireCle(cle: string): { slug: string; variantId: string | null } {
  const coupe = cle.indexOf("::");
  if (coupe < 0) return { slug: cle, variantId: null };
  return { slug: cle.slice(0, coupe), variantId: cle.slice(coupe + 2) };
}

export function addToCart(slug: string, qty = 1, variantId?: string | null) {
  const cle = cleArticle(slug, variantId);
  set({ ...cart, [cle]: (cart[cle] ?? 0) + qty });
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

/**
 * Le mode de récupération se choisit au rayon comme au panier.
 *
 * Les deux pastilles « Retrait en salle » et « Livraison » s'affichaient en
 * haut de la boutique sans rien faire — on les touchait, rien ne bougeait,
 * et le choix se refaisait de toute façon au panier. C'est le même réglage :
 * il vit ici, avec le panier, et se retrouve d'un écran à l'autre.
 */
export function setRecuperation(suivant: Recuperation) {
  mode = suivant;
  try {
    window.localStorage.setItem(MODE_KEY, suivant);
  } catch {
    // idem
  }
  emit();
}

export function useRecuperation(): { mode: Recuperation; setRecuperation: (m: Recuperation) => void } {
  const courant = useSyncExternalStore(
    subscribe,
    () => mode,
    () => "pickup" as const,
  );
  return { mode: courant, setRecuperation };
}

export function useCart() {
  const items = useSyncExternalStore(
    subscribe,
    () => cart,
    () => EMPTY,
  );
  const list = Object.entries(items).map(([cle, qty]) => ({ cle, ...lireCle(cle), qty }));
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
