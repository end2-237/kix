import Image from "next/image";
import Link from "next/link";
import { ScreenHeader } from "@/components/kix/AppHeader";
import { Chip } from "@/components/ui/Chip";
import { events, f } from "@/lib/exports";

export const metadata = { title: "Événements" };

export default function EventsPage() {
  return (
    <>
      <ScreenHeader title="Événements" />
      {events.map((event) => (
        <Link
          key={event.slug}
          href={`/app/events/${event.slug}`}
          className="glass relative block h-40 overflow-hidden rounded-card"
        >
          <Image src={event.image} alt={event.title} fill sizes="430px" className="object-cover" />
          <div className="absolute inset-0 bg-linear-to-b from-night/10 via-night/45 to-night/95" />
          <div className="absolute inset-x-4 bottom-3.5 flex flex-col gap-1.5">
            <div className="flex gap-1.5">
              {event.tags.map((tag) => (
                <Chip key={tag} tone="green" className="px-2.5 py-1 text-[10px] tracking-[0.06em] uppercase">
                  {tag}
                </Chip>
              ))}
            </div>
            <span className="font-display text-lg">{event.title}</span>
            <span className="text-xs text-dim">
              {event.day} · {event.hours} · dès {f(event.price)}
            </span>
          </div>
        </Link>
      ))}
    </>
  );
}
