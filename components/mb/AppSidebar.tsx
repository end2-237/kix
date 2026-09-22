"use client";

import { Photo } from "@/components/ui/Photo";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BellIcon,
  BoltIcon,
  CartIcon,
  CoinIcon,
  HomeIcon,
  MasterMark,
  MapIcon,
  PlusIcon,
  QrIcon,
  TargetIcon,
  TicketIcon,
  TrophyIcon,
} from "@/components/icons";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { cn } from "@/lib/cn";
import { Counter } from "@/components/ui/Counter";
import { useCart } from "@/lib/cart";
import type { User } from "@/db";

const primary = [
  { href: "/app", label: "Accueil", Icon: HomeIcon },
  { href: "/app/pass", label: "Master Pass", Icon: QrIcon },
  { href: "/app/salles", label: "Salles", Icon: MapIcon },
  { href: "/app/shop", label: "Shop", Icon: CartIcon, cart: true },
  { href: "/direct", label: "Direct", Icon: BoltIcon },
  { href: "/app/live", label: "Scores", Icon: TargetIcon },
  { href: "/app/events", label: "Événements", Icon: TicketIcon },
  { href: "/app/tournois", label: "Tournois", Icon: TrophyIcon },
  { href: "/app/rewards", label: "Rewards", Icon: TrophyIcon },
];

const secondary = [
  { href: "/app/amis", label: "Mes amis" },
  { href: "/app/abonnement", label: "Abonnement Master Break" },
  { href: "/app/classement", label: "Classement des joueurs" },
  { href: "/app/cours", label: "Cours de billard" },
  { href: "/app/reservations", label: "Mes réservations" },
  { href: "/app/commandes", label: "Mes commandes" },
  { href: "/app/billets", label: "Mes billets" },
  { href: "/app/notifications", label: "Notifications" },
];

/** Navigation latérale : la version bureau de la barre d'onglets. */
export function AppSidebar({ user, balance, unread }: { user: User; balance: number; unread: number }) {
  const pathname = usePathname();
  const { count } = useCart();
  const isActive = (href: string) => (href === "/app" ? pathname === "/app" : pathname.startsWith(href));

  return (
    <aside className="hidden w-66 shrink-0 lg:block">
      <div className="sticky top-0 flex h-dvh flex-col gap-6 border-r border-line bg-surface p-4">
        <div className="flex items-center justify-between gap-3 px-2 pt-2">
          <Link href="/" className="flex items-center gap-2.5">
            <MasterMark size={28} />
            <span className="flex flex-col">
              <span className="text-[15px] font-bold tracking-[0.16em]">MASTER BREAK</span>
              <span className="text-[11px] text-muted">Douala · Akwa</span>
            </span>
          </Link>
          <ThemeToggle className="h-10 w-10" />
        </div>

        <div className="glass-gold flex flex-col gap-3 rounded-card p-4">
          <span className="label-caps">Solde Master Pass</span>
          <span className="flex items-baseline gap-2">
            <Counter
              value={balance}
              format="pad2"
              animateOnMount={false}
              className="text-[28px] leading-none font-bold tracking-[-0.03em] text-gold-text"
            />
            <span className="text-xs text-muted">jetons</span>
          </span>
          <Link
            href="/app/recharge"
            className="press go flex h-10 items-center justify-center gap-1.5 rounded-full bg-gold text-[13px] font-semibold text-gold-ink transition hover:brightness-105"
          >
            Recharger
            <PlusIcon size={14} />
          </Link>
        </div>

        <nav className="flex flex-col gap-1">
          {primary.map(({ href, label, Icon, cart }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "press flex h-11 items-center gap-3 rounded-full px-4 text-sm transition hover:translate-x-0.5",
                isActive(href)
                  ? "border border-gold/30 bg-gold/12 font-semibold text-gold-text"
                  : "text-dim hover:bg-surface-2 hover:text-ink",
              )}
            >
              <Icon size={18} />
              {label}
              {cart && count > 0 ? (
                <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-gold px-1.5 text-[10px] font-semibold text-gold-ink">
                  {count}
                </span>
              ) : null}
            </Link>
          ))}
        </nav>

        <div className="flex flex-col gap-1 border-t border-line pt-4">
          {secondary.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex h-9 items-center gap-2 rounded-full px-4 text-[13px] transition hover:translate-x-0.5 hover:text-ink",
                isActive(href) ? "text-gold-text" : "text-muted",
              )}
            >
              {label}
              {href === "/app/notifications" && unread > 0 ? (
                <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-gold px-1.5 text-[10px] font-semibold text-gold-ink">
                  {unread}
                </span>
              ) : null}
            </Link>
          ))}
        </div>

        <Link href="/app/rewards" className="glass lift mt-auto flex items-center gap-3 rounded-card p-3">
          {user.avatar ? (
            <Photo
              src={user.avatar}
              alt={user.name}
              width={38}
              height={38}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <span className="grid h-10 w-10 place-items-center rounded-full bg-surface-2 text-xs font-semibold">
              {user.name.slice(0, 2).toUpperCase()}
            </span>
          )}
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-[13px] font-semibold">{user.name}</span>
            <span className="text-[11px] text-muted">{user.points} points</span>
          </span>
          <BellIcon size={16} className="ml-auto text-muted" />
        </Link>
      </div>
    </aside>
  );
}

/** Bandeau haut visible seulement sur grand écran. */
export function DesktopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="hidden items-end justify-between gap-4 border-b border-line pb-5 lg:flex">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[28px]">{title}</h1>
        {subtitle ? <p className="text-[13px] text-muted">{subtitle}</p> : null}
      </div>
      <Link
        href="/app/pass"
        className="flex h-11 items-center gap-2 rounded-full bg-gold px-5 text-[13px] font-semibold text-gold-ink"
      >
        <CoinIcon size={16} />
        Mon QR de partie
      </Link>
    </div>
  );
}
