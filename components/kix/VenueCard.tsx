import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { f, km } from "@/lib/format";
import type { Venue } from "@/db";

export function VenueCard({ venue, className }: { venue: Venue; className?: string }) {
  return (
    <Link
      href="/app/recharge"
      className={cn("glass block w-45 shrink-0 overflow-hidden rounded-card transition hover:bg-surface-2", className)}
    >
      <div className="relative h-22">
        <Image src={venue.image} alt={venue.name} fill sizes="180px" className="object-cover" />
        <span className="absolute top-2 left-2 flex items-center gap-1.5 rounded-full bg-black/70 px-2 py-1 text-[10px] text-white">
          <span className={cn("h-1.5 w-1.5 rounded-full", venue.freeTables > 0 ? "bg-green" : "bg-amber")} />
          {venue.freeTables > 0 ? `${venue.freeTables} tables libres` : "Complet"}
        </span>
      </div>
      <div className="flex flex-col gap-1 px-3 py-2.5">
        <span className="text-sm font-semibold">{venue.name}</span>
        <span className="text-[11px] text-muted">
          {km(venue.distanceKm)} · Jeton {f(venue.tokenPrice)}
        </span>
      </div>
    </Link>
  );
}
