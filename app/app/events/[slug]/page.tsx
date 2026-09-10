import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TicketButton } from "@/components/kix/TicketButton";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import {
  BookmarkIcon,
  CalendarIcon,
  ChevronLeftIcon,
  PinIcon,
  ShareIcon,
} from "@/components/icons";
import { eventBySlug, events, venueById, you } from "@/lib/exports";

export function generateStaticParams() {
  return events.map((event) => ({ slug: event.slug }));
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = eventBySlug(slug);
  if (!event) notFound();

  const venue = venueById(event.venueId);
  const avatars = ["/img/p-ariel.jpg", "/img/p-yannick.jpg", "/img/p-champion.jpg"];

  return (
    <div className="-mx-5 -mt-4 pb-40">
      <div className="relative h-80">
        <Image src={event.image} alt={event.title} fill sizes="430px" className="object-cover" priority />
        <div className="absolute inset-0 bg-linear-to-b from-night/55 via-night/10 to-night" />
        <div className="absolute inset-x-5 top-4 flex items-center justify-between">
          <Link
            href="/app"
            aria-label="Retour"
            className="grid h-11 w-11 place-items-center rounded-[14px] border border-white/15 bg-night/55 backdrop-blur"
          >
            <ChevronLeftIcon size={18} />
          </Link>
          <div className="flex gap-2.5">
            <button
              aria-label="Partager"
              className="grid h-11 w-11 place-items-center rounded-[14px] border border-white/15 bg-night/55 backdrop-blur"
            >
              <ShareIcon size={17} />
            </button>
            <button
              aria-label="Enregistrer"
              className="grid h-11 w-11 place-items-center rounded-[14px] border border-white/15 bg-night/55 text-green backdrop-blur"
            >
              <BookmarkIcon size={17} />
            </button>
          </div>
        </div>
      </div>

      <div className="relative -mt-24 flex flex-col gap-4 rounded-t-[30px] border-t border-white/10 bg-night/92 px-5 pt-6 backdrop-blur-xl">
        <div className="flex flex-col gap-2.5">
          <div className="flex gap-1.5">
            {event.tags.map((tag, i) => (
              <Chip
                key={tag}
                tone={i === 0 ? "green" : "violet"}
                className="px-2.5 py-1 text-[10px] font-semibold tracking-[0.08em] uppercase"
              >
                {tag}
              </Chip>
            ))}
          </div>
          <h1 className="text-[26px] leading-7">
            {event.title}
            <br />
            {event.subtitle}
          </h1>
        </div>

        <div className="flex flex-col gap-3">
          <Row
            icon={<CalendarIcon size={19} />}
            tone="green"
            title={event.day}
            detail={`${event.hours} · ${event.checkin}`}
            action="Rappel"
          />
          <Row
            icon={<PinIcon size={19} />}
            tone="violet"
            title={venue.name}
            detail={event.address}
            action="Itinéraire"
          />
          <div className="flex items-center gap-3">
            <Image
              src={event.organizer.avatar}
              alt={event.organizer.name}
              width={44}
              height={44}
              className="h-11 w-11 rounded-[14px] object-cover"
            />
            <div className="flex grow flex-col gap-0.5">
              <span className="text-sm font-semibold">
                {event.organizer.name} · {event.organizer.role}
              </span>
              <span className="text-xs text-muted">{event.organizer.detail}</span>
            </div>
            <span className="rounded-xl border border-green/38 bg-green/15 px-3.5 py-2 text-xs font-semibold text-green">
              Suivre
            </span>
          </div>
        </div>

        <Card className="flex items-center gap-3 px-3.5 py-3">
          <div className="flex">
            {avatars.map((src, i) => (
              <Image
                key={src}
                src={src}
                alt=""
                width={34}
                height={34}
                className={`h-9 w-9 rounded-full border-2 border-night object-cover ${i > 0 ? "-ml-3" : ""}`}
              />
            ))}
            <span className="-ml-3 grid h-9 w-9 place-items-center rounded-full border-2 border-night bg-night-2 text-[10px] font-semibold text-dim">
              +{event.attendees - avatars.length}
            </span>
          </div>
          <div className="flex grow flex-col gap-0.5">
            <span className="text-[13px] font-semibold">{event.attendees} joueurs inscrits</span>
            <span className="text-[11px] text-muted">
              Il reste {event.capacity - event.attendees} places sur {event.capacity}
            </span>
          </div>
        </Card>

        <div className="flex flex-col gap-2">
          <h2 className="text-base">Le déroulé</h2>
          <p className="text-[13px] leading-5 text-dim text-pretty">
            {event.description} <span className="text-green">Lire la suite</span>
          </p>
        </div>

        <p className="text-[11px] text-muted">
          Ton pass est scanné à l&apos;entrée, comme un jeton — au nom de {you.name}.
        </p>
      </div>

      <div className="fixed inset-x-0 bottom-24 z-20 mx-auto w-full max-w-[430px] px-5">
        <div className="glass-strong rounded-card px-4 py-3">
          <TicketButton price={event.price} />
        </div>
      </div>
    </div>
  );
}

function Row({
  icon,
  tone,
  title,
  detail,
  action,
}: {
  icon: React.ReactNode;
  tone: "green" | "violet";
  title: string;
  detail: string;
  action: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={
          tone === "green"
            ? "grid h-11 w-11 shrink-0 place-items-center rounded-[14px] border border-green/30 bg-green/12 text-green"
            : "grid h-11 w-11 shrink-0 place-items-center rounded-[14px] border border-violet/30 bg-violet/12 text-violet-soft"
        }
      >
        {icon}
      </span>
      <div className="flex grow flex-col gap-0.5">
        <span className="text-sm font-semibold">{title}</span>
        <span className="text-xs text-muted">{detail}</span>
      </div>
      <span className="glass rounded-xl px-3 py-2 text-xs">{action}</span>
    </div>
  );
}
