import Image from "next/image";
import Link from "next/link";
import { AppHeader } from "@/components/kix/AppHeader";
import { WalletStrip } from "@/components/kix/WalletStrip";
import { VenueCard } from "@/components/kix/VenueCard";
import { Chip } from "@/components/ui/Chip";
import { SectionTitle } from "@/components/ui/Card";
import { ChevronRightIcon, SearchIcon, SlidersIcon } from "@/components/icons";
import { events, f, venues } from "@/lib/exports";

const categories = ["Tout", "Billard", "Vapes", "Soirées"];

export default function AccueilPage() {
  const [featured, tonight] = events;

  return (
    <>
      <AppHeader />

      <div className="flex gap-2.5">
        <div className="glass flex h-12 grow items-center gap-2.5 rounded-2xl px-4 text-muted">
          <SearchIcon size={17} />
          <span className="text-sm">Salle, tournoi, puff…</span>
        </div>
        <button
          aria-label="Filtres"
          className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-violet/40 bg-violet/15 text-violet-soft"
        >
          <SlidersIcon size={18} />
        </button>
      </div>

      <WalletStrip />

      <Link
        href={`/app/events/${featured.slug}`}
        className="relative block h-44 overflow-hidden rounded-[22px] border border-white/9"
      >
        <Image src="/img/hero-player.jpg" alt={featured.title} fill sizes="430px" className="object-cover" priority />
        <div className="absolute inset-0 bg-linear-to-b from-night/10 via-night/40 to-night/95" />
        <div className="absolute inset-x-4 bottom-3.5 flex flex-col gap-2">
          <div className="flex gap-1.5">
            <span className="rounded-full border border-green/45 bg-green/20 px-2.5 py-1 text-[10px] font-semibold tracking-[0.08em] text-green uppercase">
              Tournoi
            </span>
            <span className="rounded-full border border-white/15 bg-night/55 px-2.5 py-1 text-[10px] font-medium">
              03 oct · 18h
            </span>
          </div>
          <h2 className="text-[22px] leading-6">
            {featured.title}
            <br />
            {featured.subtitle}
          </h2>
          <div className="flex items-center justify-between">
            <span className="text-xs text-dim">Le Break Akwa · {featured.attendees} inscrits</span>
            <span className="rounded-xl border border-white/18 bg-white/10 px-3.5 py-2 text-xs font-semibold">
              Dès {f(featured.price)}
            </span>
          </div>
        </div>
      </Link>

      <div className="flex gap-2">
        {categories.map((c, i) => (
          <Chip key={c} tone={i === 0 ? "solid" : "neutral"}>
            {c}
          </Chip>
        ))}
      </div>

      <div className="flex flex-col gap-2.5">
        <SectionTitle title="Salles près de toi" action="Voir la carte" href="/app/salles" />
        <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-1">
          {venues.map((venue) => (
            <VenueCard key={venue.id} venue={venue} />
          ))}
        </div>
      </div>

      <Link href={`/app/events/${tonight.slug}`} className="glass flex items-center gap-3 rounded-card p-3">
        <Image
          src={tonight.image}
          alt={tonight.title}
          width={62}
          height={62}
          className="h-16 w-16 rounded-[14px] object-cover"
        />
        <div className="flex grow flex-col gap-1">
          <span className="text-sm font-semibold">{tonight.title}</span>
          <span className="text-[11px] text-muted">
            {tonight.day} · 21h · Pass {f(tonight.price)}
          </span>
        </div>
        <span className="grid h-10 w-10 place-items-center rounded-xl border border-violet/40 bg-violet/15 text-violet-soft">
          <ChevronRightIcon size={15} />
        </span>
      </Link>
    </>
  );
}
