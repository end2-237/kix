import Image from "next/image";
import Link from "next/link";
import { KixMark, BellIcon, ChevronDownIcon, PinIcon } from "@/components/icons";
import { you } from "@/lib/data";

export function AppHeader({ city = "Douala", area = "Akwa" }: { city?: string; area?: string }) {
  return (
    <header className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <KixMark />
        <div className="flex flex-col gap-0.5">
          <span className="font-display text-[19px] leading-[19px] tracking-[0.14em]">KIX</span>
          <span className="flex items-center gap-1 text-[11px] text-muted">
            <PinIcon size={11} />
            {city} · {area}
            <ChevronDownIcon size={9} />
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          aria-label="Notifications"
          className="glass relative grid h-11 w-11 place-items-center rounded-[14px]"
        >
          <BellIcon size={19} />
          <span className="absolute top-2.5 right-3 h-1.5 w-1.5 rounded-full bg-green shadow-[0_0_8px_rgba(61,240,138,0.9)]" />
        </button>
        <Link href="/app/rewards" aria-label="Mon profil">
          <Image
            src={you.avatar}
            alt={you.name}
            width={44}
            height={44}
            className="h-11 w-11 rounded-[14px] border border-green/45 object-cover"
          />
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
        className="glass grid h-11 w-11 shrink-0 place-items-center rounded-[14px]"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M14 6l-6 6 6 6" />
        </svg>
      </Link>
      <h1 className="text-[17px]">{title}</h1>
      <div className="flex h-11 w-11 shrink-0 items-center justify-end">{action}</div>
    </header>
  );
}
