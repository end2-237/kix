import Image from "next/image";
import Link from "next/link";
import { AppHeader } from "@/components/kix/AppHeader";
import { WalletStrip } from "@/components/kix/WalletStrip";
import { VenueCard } from "@/components/kix/VenueCard";
import { Chip } from "@/components/ui/Chip";
import { SectionTitle } from "@/components/ui/Card";
import { ChevronRightIcon, SearchIcon, SlidersIcon } from "@/components/icons";
import { getBalance, getEvents, getUnreadCount, getVenues } from "@/lib/queries";
import { requireUser } from "@/lib/session";
import { f } from "@/lib/format";

const categories = ["Tout", "Billard", "Vapes", "Soirées"];

export default async function AccueilPage() {
  const user = await requireUser();
  const [balance, venues, events, unread] = await Promise.all([
    getBalance(user.id),
    getVenues(),
    getEvents(),
    getUnreadCount(user.id),
  ]);
  const [featured, tonight] = events;

  return (
    <>
      <AppHeader user={user} unread={unread} />

      <div className="flex gap-2.5">
        <div className="glass flex h-12 grow items-center gap-2.5 rounded-full px-4 text-muted">
          <SearchIcon size={17} />
          <span className="text-sm">Salle, tournoi, puff…</span>
        </div>
        <button
          aria-label="Filtres"
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-violet/40 bg-violet/15 text-violet-text"
        >
          <SlidersIcon size={18} />
        </button>
      </div>

      <WalletStrip balance={balance} />

      {featured ? (
        <Link
          href={`/app/events/${featured.slug}`}
          className="relative block h-44 overflow-hidden rounded-panel border border-line"
        >
          <Image src="/img/hero-player.jpg" alt={featured.title} fill sizes="430px" className="object-cover" priority />
          <div className="absolute inset-0 bg-linear-to-b from-black/10 via-black/45 to-black/95" />
          <div className="absolute inset-x-4 bottom-3.5 flex flex-col gap-2 text-white">
            <div className="flex gap-1.5">
              <span className="rounded-full border border-green/45 bg-green/20 px-2.5 py-1 text-[10px] font-semibold tracking-[0.08em] text-green uppercase">
                Tournoi
              </span>
              <span className="rounded-full border border-white/20 bg-black/50 px-2.5 py-1 text-[10px] font-medium">
                {featured.day}
              </span>
            </div>
            <h2 className="text-[22px] leading-6 text-white">
              {featured.title}
              <br />
              {featured.subtitle}
            </h2>
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/75">{featured.attendees} inscrits</span>
              <span className="rounded-full border border-white/20 bg-white/12 px-3.5 py-2 text-xs font-semibold">
                Dès {f(featured.price)}
              </span>
            </div>
          </div>
        </Link>
      ) : null}

      <div className="flex gap-2">
        {categories.map((c, i) => (
          <Chip key={c} tone={i === 0 ? "solid" : "neutral"}>
            {c}
          </Chip>
        ))}
      </div>

      <div className="flex flex-col gap-2.5">
        <SectionTitle title="Salles près de toi" action="Voir toutes" href="/app/salles" />
        <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-1">
          {venues.map((venue) => (
            <VenueCard key={venue.id} venue={venue} />
          ))}
        </div>
      </div>

      {tonight ? (
        <Link href={`/app/events/${tonight.slug}`} className="glass flex items-center gap-3 rounded-card p-3">
          <Image
            src={tonight.image}
            alt={tonight.title}
            width={62}
            height={62}
            className="h-16 w-16 rounded-card object-cover"
          />
          <div className="flex grow flex-col gap-1">
            <span className="text-sm font-semibold">{tonight.title}</span>
            <span className="text-[11px] text-muted">
              {tonight.day} · {tonight.hours} · Pass {f(tonight.price)}
            </span>
          </div>
          <span className="grid h-10 w-10 place-items-center rounded-full border border-violet/40 bg-violet/15 text-violet-text">
            <ChevronRightIcon size={15} />
          </span>
        </Link>
      ) : null}
    </>
  );
}
