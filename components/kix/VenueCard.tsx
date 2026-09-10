import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { f, km } from "@/lib/format";
import type { Venue } from "@/lib/data";

export function VenueCard({ venue, className }: { venue: Venue; className?: string }) {
  return (
    <Link
      href="/app/recharge"
      className={cn("glass block w-[178px] shrink-0 overflow-hidden rounded-[18px] transition hover:bg-white/8", className)}
    >
      <div className="relative h-22">
        <Image src={venue.image} alt={venue.name} fill sizes="178px" className="object-cover" />
        {venue.tag ? (
          <span className="absolute top-2 left-2 flex items-center gap-1.5 rounded-full bg-night/70 px-2 py-1 text-[10px]">
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                venue.tag.tone === "green" ? "bg-green" : "bg-violet",
              )}
            />
            <span className={venue.tag.tone === "green" ? "text-green" : "text-violet-soft"}>
              {venue.tag.label}
            </span>
          </span>
        ) : null}
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
