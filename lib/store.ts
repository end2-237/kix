"use client";

import { useSyncExternalStore } from "react";
import { packs, type Pack } from "@/lib/data";

export type Token = { id: string; code: string; venueId: string };

export type Entry = {
  id: string;
  label: string;
  detail: string;
  delta: string;
  kind: "in" | "out" | "xp";
};

export type PaymentMethod = "om" | "momo";

export type ScanResult = { ok: true; token: Token } | { ok: false; reason: "format" | "inconnu" };

export type State = {
  tokens: Token[];
  points: number;
  cart: Record<string, number>;
  history: Entry[];
};

const STORAGE_KEY = "kix.state.v1";
export const XP_PER_TOKEN = 40;
export const POINTS_PER_FREE_TOKEN = 500;

// État de démonstration : sept jetons déjà crédités, codes de secours fixes pour
// que le rendu serveur et l'hydratation partent du même point.
const SEED: State = {
  tokens: ["4826", "7391", "5204", "8137", "2965", "6478", "3512"].map((code, i) => ({
    id: `seed-${i + 1}`,
    code,
    venueId: "break-akwa",
  })),
  points: 1240,
  cart: { "puff-neon": 1, "pod-1000": 1 },
  history: [
    { id: "seed-h1", label: "Recharge Pack 3 jetons", detail: "Hier 19:42 · MTN MoMo", delta: "+3", kind: "in" },
    { id: "seed-h2", label: "Jeton scanné · table 3", detail: "Hier 22:10 · Le Break Akwa", delta: "−1", kind: "out" },
    { id: "seed-h3", label: "+120 XP · KIX Rewards", detail: "Hier 22:11 · série de 5 soirs", delta: "+120", kind: "xp" },
  ],
};

/* --------------------------------------------------------------------------
 * Store externe (hors React) : lu par useSyncExternalStore, donc l'hydratation
 * part de SEED puis bascule sur le contenu du localStorage sans décalage.
 * -------------------------------------------------------------------------- */

let state: State = SEED;
let loaded = false;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function persist() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // navigation privée ou stockage plein : l'interface continue de fonctionner
  }
}

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      state = { ...SEED, ...(JSON.parse(raw) as Partial<State>) };
      emit();
    }
  } catch {
    // idem : on garde l'état de départ
  }
}

function set(next: State) {
  state = next;
  persist();
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  load();
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = () => state;
const getServerSnapshot = () => SEED;

/* --------------------------------------------------------------------------
 * Actions
 * -------------------------------------------------------------------------- */

function newCode(taken: Set<string>): string {
  for (let i = 0; i < 50; i++) {
    const code = String(Math.floor(1000 + Math.random() * 9000));
    if (!taken.has(code)) return code;
  }
  return String(Date.now()).slice(-4);
}

function now(): string {
  return new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export function buyPack(pack: Pack, venueId: string, method: PaymentMethod) {
  const taken = new Set(state.tokens.map((t) => t.code));
  const credited = pack.tokens + (pack.bonus ? 2 : 0);
  const fresh: Token[] = [];
  for (let i = 0; i < credited; i++) {
    const code = newCode(taken);
    taken.add(code);
    fresh.push({ id: `${Date.now()}-${i}`, code, venueId });
  }
  set({
    ...state,
    tokens: [...state.tokens, ...fresh],
    history: [
      {
        id: `h-${Date.now()}`,
        label: `Recharge ${pack.tokens} jeton${pack.tokens > 1 ? "s" : ""}`,
        detail: `Aujourd'hui ${now()} · ${method === "om" ? "Orange Money" : "MTN MoMo"}`,
        delta: `+${credited}`,
        kind: "in",
      },
      ...state.history,
    ],
  });
}

/** Débite le jeton portant ce code : c'est l'opération de KIX Scan. */
export function consumeCode(raw: string): ScanResult {
  const code = raw.trim();
  if (!/^\d{4}$/.test(code)) return { ok: false, reason: "format" };

  const token = state.tokens.find((t) => t.code === code);
  if (!token) return { ok: false, reason: "inconnu" };

  set({
    ...state,
    tokens: state.tokens.filter((t) => t.id !== token.id),
    points: state.points + XP_PER_TOKEN,
    history: [
      {
        id: `h-${Date.now()}`,
        label: "Jeton débité",
        detail: `Aujourd'hui ${now()} · code ${code}`,
        delta: "−1",
        kind: "out",
      },
      ...state.history,
    ],
  });
  return { ok: true, token };
}

export function addToCart(id: string) {
  set({ ...state, cart: { ...state.cart, [id]: (state.cart[id] ?? 0) + 1 } });
}

export function removeFromCart(id: string) {
  const qty = (state.cart[id] ?? 0) - 1;
  const cart = { ...state.cart };
  if (qty > 0) cart[id] = qty;
  else delete cart[id];
  set({ ...state, cart });
}

export function clearCart() {
  set({ ...state, cart: {} });
}

/** 500 points = 1 jeton offert. Renvoie false si le solde est insuffisant. */
export function convertPoints(): boolean {
  if (state.points < POINTS_PER_FREE_TOKEN) return false;
  const taken = new Set(state.tokens.map((t) => t.code));
  set({
    ...state,
    points: state.points - POINTS_PER_FREE_TOKEN,
    tokens: [...state.tokens, { id: `free-${Date.now()}`, code: newCode(taken), venueId: "break-akwa" }],
    history: [
      {
        id: `h-${Date.now()}`,
        label: "Jeton offert · KIX Rewards",
        detail: `Aujourd'hui ${now()} · ${POINTS_PER_FREE_TOKEN} points`,
        delta: "+1",
        kind: "in",
      },
      ...state.history,
    ],
  });
  return true;
}

export function reset() {
  set(SEED);
}

/* --------------------------------------------------------------------------
 * Hook
 * -------------------------------------------------------------------------- */

export function useKix() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const cartItems = Object.entries(snapshot.cart).map(([id, qty]) => ({ id, qty }));

  return {
    ...snapshot,
    tokenCount: snapshot.tokens.length,
    cartItems,
    cartCount: cartItems.reduce((n, item) => n + item.qty, 0),
    buyPack,
    consumeCode,
    addToCart,
    removeFromCart,
    clearCart,
    convertPoints,
    reset,
  };
}

export const defaultPack = packs[1];
