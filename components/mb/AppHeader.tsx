import Image from "next/image";
import Link from "next/link";
import { BellIcon, ChevronDownIcon, ChevronLeftIcon, MasterMark, PinIcon } from "@/components/icons";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import type { User } from "@/db";

export function AppHeader({
  user,
  unread = 0,
  city = "Douala",
  area = "Akwa",
  title,
  subtitle,
}: {
  user: User;
  unread?: number;
  city?: string;
  area?: string;
  title?: string;
  subtitle?: string;
}) {
  return (
    <>
      {/* format bureau : la barre latérale porte déjà l'identité et le solde */}
      <header className="hidden items-end justify-between gap-4 border-b border-line pb-5 lg:flex">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[28px]">{title ?? `Bonsoir ${user.name.split(" ")[0]}`}</h1>
          <p className="text-[13px] text-muted">{subtitle ?? `${city} · ${area} · les tables ouvrent à 17 h`}</p>
        </div>
        <Link
          href="/app/notifications"
          className="glass flex h-11 items-center gap-2.5 rounded-full px-4 text-[13px] text-dim transition hover:text-ink"
        >
          <BellIcon size={17} />
          {unread > 0 ? `${unread} notifications` : "Notifications"}
        </Link>
      </header>

      <header className="flex items-center justify-between gap-3 lg:hidden">
      <div className="flex items-center gap-2.5">
        <MasterMark />
        <div className="flex flex-col gap-0.5">
          <span className="text-[19px] leading-[19px] font-bold tracking-[0.14em]">MASTER BREAK</span>
          <span className="flex items-center gap-1 text-[11px] text-muted">
            <PinIcon size={11} />
            {city} · {area}
            <ChevronDownIcon size={9} />
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <ThemeToggle />
        <Link
          href="/app/notifications"
          aria-label={unread > 0 ? `${unread} notifications non lues` : "Notifications"}
          className="glass relative grid h-11 w-11 place-items-center rounded-full"
        >
          <BellIcon size={19} />
          {unread > 0 ? (
            <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-gold px-1.5 text-[10px] font-semibold text-gold-ink">
              {unread}
            </span>
          ) : null}
        </Link>
        <Link href="/app/rewards" aria-label="Mon profil">
          {user.avatar ? (
            <Image
              src={user.avatar}
              alt={user.name}
              width={44}
              height={44}
              className="h-11 w-11 rounded-full border border-gold/45 object-cover"
            />
          ) : (
            <span className="grid h-11 w-11 place-items-center rounded-full border border-gold/45 bg-surface text-[13px] font-semibold">
              {user.name.slice(0, 2).toUpperCase()}
            </span>
          )}
        </Link>
      </div>
      </header>
    </>
  );
}

export function ScreenHeader({
  title,
  subtitle,
  back = "/app",
  action,
}: {
  title: string;
  subtitle?: string;
  back?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="flex items-center justify-between gap-3 lg:items-end lg:border-b lg:border-line lg:pb-5">
      <Link
        href={back}
        aria-label="Retour"
        className="glass grid h-11 w-11 shrink-0 place-items-center rounded-full lg:hidden"
      >
        <ChevronLeftIcon size={18} />
      </Link>
      <div className="flex min-w-0 flex-col gap-1.5">
        <h1 className="truncate text-[17px] lg:text-[28px]">{title}</h1>
        {subtitle ? <p className="hidden text-[13px] text-muted lg:block">{subtitle}</p> : null}
      </div>
      <div className="flex h-11 min-w-11 shrink-0 items-center justify-end">{action}</div>
    </header>
  );
}
