import { Photo } from "@/components/ui/Photo";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ScreenHeader } from "@/components/mb/AppHeader";
import { BookTable } from "@/components/mb/BookTable";
import { Card } from "@/components/ui/Card";
import { ArrowRightIcon, CoinIcon, PinIcon, TableIcon } from "@/components/icons";
import { getFloor, getVenue } from "@/lib/queries";
import { requireUser } from "@/lib/session";
import { f, km } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const venue = await getVenue((await params).slug);
  return { title: venue?.name ?? "Salle" };
}

export default async function VenuePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [venue, user] = await Promise.all([getVenue(slug), requireUser()]);
  if (!venue) notFound();

  const floor = await getFloor(venue.id);
  const free = floor.filter((t) => t.table.status === "free").length;

  return (
    <>
      <ScreenHeader title={venue.name} subtitle={`${venue.area}, ${venue.city} · ${km(venue.distanceKm)}`} back="/app/salles" />

      <div className="relative h-44 overflow-hidden rounded-panel lg:h-64">
        <Photo src={venue.image} alt={venue.name} fill sizes="100vw" className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/20 to-transparent" />
        <div className="absolute inset-x-4 bottom-4 flex flex-wrap items-center gap-2 text-[11.5px]">
          <span className="flex items-center gap-1.5 rounded-full bg-jade/20 px-3 py-1.5 text-jade-text">
            <span className="live-dot h-1.5 w-1.5 rounded-full bg-jade" />
            {free} table{free > 1 ? "s" : ""} libre{free > 1 ? "s" : ""}
          </span>
          <span className="glass-strong flex items-center gap-1.5 rounded-full px-3 py-1.5">
            <CoinIcon size={13} className="text-gold-text" />
            Jeton {f(venue.tokenPrice)}
          </span>
          <span className="glass-strong flex items-center gap-1.5 rounded-full px-3 py-1.5">
            <PinIcon size={13} />
            {venue.address}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-base">Les tables, en direct</h2>
          <span className="text-[11px] text-muted">
            <TableIcon size={12} className="mr-1 inline" />
            {floor.length} tables
          </span>
        </div>
        <p className="text-[12.5px] leading-5 text-muted">
          L&apos;acompte retient la table et se déduit de ta note à l&apos;arrivée.
        </p>
      </div>

      {floor.length === 0 ? (
        <Card tone="dashed" shape="panel" className="flex flex-col items-center gap-3 px-5 py-9 text-center">
          <span className="grid h-13 w-13 place-items-center rounded-full bg-surface-2 text-muted">
            <TableIcon size={22} />
          </span>
          <p className="text-[13px] text-muted">
            Cette salle n&apos;a pas encore ouvert ses tables à la réservation.
          </p>
        </Card>
      ) : (
        <BookTable floor={floor} phone={user.phone} />
      )}

      <Link
        href="/app/recharge"
        className="glass press go flex items-center gap-3 rounded-card p-4 transition hover:bg-surface-2"
      >
        <span className="grid h-11 w-11 place-items-center rounded-full bg-gold/15 text-gold-text">
          <CoinIcon size={20} />
        </span>
        <span className="flex grow flex-col gap-0.5">
          <span className="text-[14px] font-semibold">Recharge avant de venir</span>
          <span className="text-[12px] text-muted">Un jeton par partie, {f(venue.tokenPrice)} ici.</span>
        </span>
        <ArrowRightIcon size={17} className="text-muted" />
      </Link>
    </>
  );
}
