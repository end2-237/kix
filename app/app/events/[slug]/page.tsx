import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TicketButton } from "@/components/kix/TicketButton";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { BookmarkIcon, CalendarIcon, ChevronLeftIcon, PinIcon, ShareIcon } from "@/components/icons";
import { getEvent, getTickets, getVenues } from "@/lib/queries";
import { requireUser } from "@/lib/session";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await getEvent(slug);
  return { title: event?.title ?? "Événement" };
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [event, user] = await Promise.all([getEvent(slug), requireUser()]);
  if (!event) notFound();

  const [venues, tickets] = await Promise.all([getVenues(), getTickets(user.id)]);
  const venue = venues.find((v) => v.id === event.venueId);
  const owned = tickets.some((t) => t.event.id === event.id && t.ticket.status === "valid");
  const avatars = ["/img/p-ariel.jpg", "/img/p-yannick.jpg", "/img/p-champion.jpg"];

  return (
    <div className="-mx-5 -mt-4 pb-40">
      <div className="relative h-80">
        <Image src={event.image} alt={event.title} fill sizes="430px" className="object-cover" priority />
        <div className="absolute inset-0 bg-linear-to-b from-black/55 via-black/10 to-bg" />
        <div className="absolute inset-x-5 top-4 flex items-center justify-between">
          <Link
            href="/app/events"
            aria-label="Retour"
            className="grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur"
          >
            <ChevronLeftIcon size={18} />
          </Link>
          <div className="flex gap-2.5">
            <button
              aria-label="Partager"
              className="grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur"
            >
              <ShareIcon size={17} />
            </button>
            <button
              aria-label="Enregistrer"
              className="grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-black/50 text-green backdrop-blur"
            >
              <BookmarkIcon size={17} />
            </button>
          </div>
        </div>
      </div>

      <div className="relative -mt-24 flex flex-col gap-4 rounded-t-[30px] border-t border-line bg-bg/95 px-5 pt-6 backdrop-blur-xl">
        <div className="flex flex-col gap-2.5">
          <div className="flex gap-1.5">
            {event.tags.split(",").filter(Boolean).map((tag, i) => (
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
            {event.subtitle ? (
              <>
                <br />
                {event.subtitle}
              </>
            ) : null}
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
            title={venue?.name ?? "Salle partenaire"}
            detail={event.address}
            action="Itinéraire"
          />
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
                className={`h-9 w-9 rounded-full border-2 border-bg object-cover ${i > 0 ? "-ml-3" : ""}`}
              />
            ))}
            <span className="-ml-3 grid h-9 w-9 place-items-center rounded-full border-2 border-bg bg-surface-2 text-[10px] font-semibold text-dim">
              +{Math.max(0, event.attendees - avatars.length)}
            </span>
          </div>
          <div className="flex grow flex-col gap-0.5">
            <span className="text-[13px] font-semibold">{event.attendees} joueurs inscrits</span>
            <span className="text-[11px] text-muted">
              Il reste {Math.max(0, event.capacity - event.attendees)} places sur {event.capacity}
            </span>
          </div>
        </Card>

        <div className="flex flex-col gap-2">
          <h2 className="text-base">Le déroulé</h2>
          <p className="text-[13px] leading-5 text-dim text-pretty">{event.description}</p>
        </div>

        <p className="text-[11px] text-muted">
          Ton pass est scanné à l&apos;entrée, comme un jeton — au nom de {user.name}.
        </p>
      </div>

      <div className="fixed inset-x-0 bottom-24 z-20 mx-auto w-full max-w-[430px] px-5">
        <div className="glass-strong rounded-full px-4 py-3">
          <TicketButton eventId={event.id} price={event.price} owned={owned} />
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
            ? "grid h-11 w-11 shrink-0 place-items-center rounded-full border border-green/30 bg-green/12 text-green-text"
            : "grid h-11 w-11 shrink-0 place-items-center rounded-full border border-violet/30 bg-violet/12 text-violet-text"
        }
      >
        {icon}
      </span>
      <div className="flex grow flex-col gap-0.5">
        <span className="text-sm font-semibold">{title}</span>
        <span className="text-xs text-muted">{detail}</span>
      </div>
      <span className="glass rounded-full px-3 py-2 text-xs">{action}</span>
    </div>
  );
}
