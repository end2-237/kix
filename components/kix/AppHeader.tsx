import Image from "next/image";
import Link from "next/link";
import { BellIcon, ChevronDownIcon, ChevronLeftIcon, KixMark, PinIcon } from "@/components/icons";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import type { User } from "@/db";

export function AppHeader({ user, unread = 0, city = "Douala", area = "Akwa" }: { user: User; unread?: number; city?: string; area?: string }) {
  return (
    <header className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <KixMark />
        <div className="flex flex-col gap-0.5">
          <span className="text-[19px] leading-[19px] font-bold tracking-[0.14em]">KIX</span>
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
            <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-green px-1.5 text-[10px] font-semibold text-green-ink">
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
              className="h-11 w-11 rounded-full border border-green/45 object-cover"
            />
          ) : (
            <span className="grid h-11 w-11 place-items-center rounded-full border border-green/45 bg-surface text-[13px] font-semibold">
              {user.name.slice(0, 2).toUpperCase()}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}

export function ScreenHeader({
  title,
  back = "/app",
  action,
}: {
  title: string;
  back?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="flex items-center justify-between gap-3">
      <Link
        href={back}
        aria-label="Retour"
        className="glass grid h-11 w-11 shrink-0 place-items-center rounded-full"
      >
        <ChevronLeftIcon size={18} />
      </Link>
      <h1 className="truncate text-[17px]">{title}</h1>
      <div className="flex h-11 min-w-11 shrink-0 items-center justify-end">{action}</div>
    </header>
  );
}
