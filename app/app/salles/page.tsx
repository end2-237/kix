import Image from "next/image";
import Link from "next/link";
import { ScreenHeader } from "@/components/mb/AppHeader";
import { Chip } from "@/components/ui/Chip";
import { ChevronRightIcon, PinIcon } from "@/components/icons";
import { getVenues } from "@/lib/queries";
import { f, km } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata = { title: "Salles partenaires" };

export default async function SallesPage() {
  const venues = await getVenues();

  return (
    <>
      <ScreenHeader title="Salles partenaires" subtitle="Tarif du jeton, tables libres et distance, mis à jour par les gérants." />

      <div className="flex gap-2">
        <Chip tone="solid">Douala</Chip>
        <Chip tone="neutral">Yaoundé</Chip>
        <Chip tone="neutral">Ouvertes</Chip>
      </div>

      <div className="flex flex-col gap-3.5 lg:grid lg:grid-cols-2 lg:gap-5">
      {venues.map((venue) => (
        <Link
          key={venue.id}
          href="/app/recharge"
          className="glass lift zoom flex gap-3 overflow-hidden rounded-card p-3"
        >
          <Image
            src={venue.image}
            alt={venue.name}
            width={92}
            height={92}
            className="h-23 w-23 rounded-card object-cover lg:h-28 lg:w-28"
          />
          <div className="flex grow flex-col justify-center gap-1.5">
            <span className="text-[15px] font-semibold">{venue.name}</span>
            <span className="flex items-center gap-1.5 text-xs text-muted">
              <PinIcon size={13} />
              {venue.area}, {venue.city} · {km(venue.distanceKm)}
            </span>
            <span className="flex flex-wrap items-center gap-2 text-[11px]">
              <span className="text-gold-text">{venue.freeTables} tables libres</span>
              <span className="text-muted">sur {venue.tables}</span>
              <span className="text-muted">· Jeton {f(venue.tokenPrice)}</span>
            </span>
          </div>
          <span className="grid w-8 place-items-center text-muted">
            <ChevronRightIcon size={16} />
          </span>
        </Link>
      ))}
      </div>
    </>
  );
}
