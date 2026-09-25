"use client";

import { DashNav, type NavItem } from "@/components/dash/DashNav";
import {
  BoltIcon,
  CalendarIcon,
  ChartIcon,
  CartIcon,
  CoinIcon,
  MapIcon,
  QrIcon,
  TableIcon,
  TargetIcon,
  TrophyIcon,
} from "@/components/icons";

/**
 * L'ordre compte : les quatre premières tiennent dans le barreau du bas, le
 * reste passe derrière « Plus ». Le scanner vient en tête parce que c'est le
 * geste d'une soirée entière.
 */
const items: NavItem[] = [
  { href: "/gerant", label: "Scanner", Icon: QrIcon, primary: true },
  { href: "/gerant/salle", label: "Salle", Icon: TableIcon },
  { href: "/gerant/direct", label: "Direct", Icon: BoltIcon },
  { href: "/gerant/evenements", label: "Soirées", Icon: CalendarIcon },
  { href: "/gerant/live", label: "Matchs", Icon: TargetIcon },
  { href: "/gerant/tournois", label: "Tournois", Icon: TrophyIcon },
  { href: "/gerant/ecrans", label: "Écrans", Icon: MapIcon },
  { href: "/gerant/service", label: "Service", Icon: ChartIcon },
  { href: "/gerant/caisse", label: "Caisse", Icon: CoinIcon },
  // Le comptoir vend aussi des puffs : la boutique du gérant est le même
  // espace que celui d'un vendeur, avec ses articles et ses commandes.
  { href: "/vendeur", label: "Boutique", Icon: CartIcon },
  // Et il enseigne, comme un joueur classé : même espace, mêmes élèves, même
  // bourse. L'entrée manquait, si bien que le droit existait sans la porte.
  { href: "/app/prof", label: "Cours", Icon: TrophyIcon },
];

export function GerantNav({ mobile = false }: { mobile?: boolean }) {
  return <DashNav items={items} mobile={mobile} />;
}
