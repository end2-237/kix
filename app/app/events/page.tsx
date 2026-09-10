import Image from "next/image";
import Link from "next/link";
import { ScreenHeader } from "@/components/kix/AppHeader";
import { Chip } from "@/components/ui/Chip";
import { getEvents } from "@/lib/queries";
import { f } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata = { title: "Événements" };

export default async function EventsPage() {
  const events = await getEvents();

  return (
    <>
      <ScreenHeader
        title="Événements"
        subtitle="Tournois et soirées des salles partenaires."
        action={
          <Link href="/app/billets" className="text-xs whitespace-nowrap text-green-text">
            Mes billets
          </Link>
        }
      />
      <div className="flex flex-col gap-3.5 lg:grid lg:grid-cols-2 lg:gap-5">
      {events.map((event) => (
        <Link
          key={event.slug}
          href={`/app/events/${event.slug}`}
          className="relative block h-40 overflow-hidden rounded-panel border border-line lg:h-72"
        >
          <Image src={event.image} alt={event.title} fill sizes="430px" className="object-cover" />
          <div className="absolute inset-0 bg-linear-to-b from-black/10 via-black/45 to-black/95" />
          <div className="absolute inset-x-4 bottom-3.5 flex flex-col gap-1.5 text-white">
            <div className="flex gap-1.5">
              {event.tags.split(",").filter(Boolean).map((tag) => (
                <Chip key={tag} tone="green" className="px-2.5 py-1 text-[10px] tracking-[0.06em] uppercase">
                  {tag}
                </Chip>
              ))}
            </div>
            <span className="text-lg font-bold">{event.title}</span>
            <span className="text-xs text-white/75">
              {event.day} · {event.hours} · dès {f(event.price)}
            </span>
          </div>
        </Link>
      ))}
      </div>
    </>
  );
}
