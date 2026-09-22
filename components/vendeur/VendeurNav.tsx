"use client";

import { DashNav, type NavItem } from "@/components/dash/DashNav";
import { CartIcon, ChartIcon, TruckIcon } from "@/components/icons";

const items: NavItem[] = [
  { href: "/vendeur", label: "Ventes", Icon: ChartIcon, primary: true },
  { href: "/vendeur/articles", label: "Articles", Icon: CartIcon },
  { href: "/vendeur/commandes", label: "Commandes", Icon: TruckIcon },
];

export function VendeurNav({ mobile = false }: { mobile?: boolean }) {
  return <DashNav items={items} mobile={mobile} />;
}
