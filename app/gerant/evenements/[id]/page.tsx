import { Photo } from "@/components/ui/Photo";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { ChevronLeftIcon, TicketIcon } from "@/components/icons";
import { getEventAttendees, getVenueEvents } from "@/lib/queries";
import { requireRole } from "@/lib/session";
import { displayPhone } from "@/lib/phone";
import { f, fcfa } from "@/lib/format";
import { cn } from "@/lib/cn";

export const dynamic = "force-dynamic";

const ETAT: Record<string, { label: string; ton: string }> = {
  valid: { label: "à venir", ton: "border-gold/40 bg-gold/12 text-gold-text" },
  used: { label: "entré", ton: "border-jade/40 bg-jade/12 text-jade-text" },
  pending: { label: "en attente", ton: "border-warn/40 bg-warn/12 text-warn" },
  failed: { label: "échoué", ton: "border-line bg-surface-2 text-muted" },
};

export default async function GerantEvenement({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const manager = await requireRole("manager", "admin");
  if (!manager.venueId) notFound();

  // On repasse par les événements de la salle : un identifiant deviné dans
  // l'URL ne doit pas ouvrir l'agenda du voisin.
  const ligne = (await getVenueEvents(manager.venueId)).find((l) => l.event.id === id);
  if (!ligne) notFound();

  const { event, vendus, entres, attente, recette } = ligne;
  const participants = await getEventAttendees(event.id);

  return (
    <div className="flex flex-col gap-5">
      <Link href="/gerant/evenements" className="press flex w-fit items-center gap-1.5 text-[13px] text-muted hover:text-ink">
        <ChevronLeftIcon size={15} /> Les événements
      </Link>

      <div className="flex gap-3.5">
        <span className="relative h-20 w-20 shrink-0 overflow-hidden rounded-panel">
          <Photo src={event.image} alt="" fill sizes="80px" className="object-cover" />
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-[19px] leading-tight lg:text-[26px]">{event.title}</h1>
          <p className="text-[13px] text-muted">
            {event.day} · {event.hours} · {event.price > 0 ? f(event.price) : "entrée libre"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <Chiffre valeur={fcfa(Number(recette))} quoi="encaissé" tone="gold" />
        <Chiffre valeur={`${Number(vendus)} / ${event.capacity}`} quoi="places vendues" />
        <Chiffre valeur={String(Number(entres))} quoi="entrés" />
        <Chiffre valeur={String(Number(attente))} quoi="en attente" />
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-[15px]">
          Les participants
          <span className="ml-2 text-[13px] text-muted">{participants.length}</span>
        </h2>

        {participants.length === 0 ? (
          <Card tone="dashed" shape="panel" className="flex flex-col items-center gap-3 px-5 py-10 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-surface-2 text-muted">
              <TicketIcon size={20} />
            </span>
            <p className="text-[13px] text-muted">Personne n&apos;a encore pris sa place.</p>
          </Card>
        ) : null}

        <div className="flex flex-col gap-2">
          {participants.map(({ ticket, user, paye }) => {
            const etat = ETAT[ticket.status] ?? ETAT.failed;
            return (
              <Card key={ticket.id} shape="panel" className="flex items-center gap-3 p-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface-2 text-[12px] font-semibold text-dim">
                  {user.name.slice(0, 2).toUpperCase()}
                </span>

                <span className="flex min-w-0 grow flex-col gap-0.5">
                  <span className="truncate text-[14px] font-semibold">{user.name}</span>
                  <span className="text-[12px] text-muted">{displayPhone(user.phone)}</span>
                </span>

                <span className="flex shrink-0 flex-col items-end gap-1">
                  <span className={cn("rounded-full border px-2.5 py-0.5 text-[10.5px]", etat.ton)}>{etat.label}</span>
                  <span className="text-[12px] text-muted">{paye ? fcfa(paye) : "gratuit"}</span>
                </span>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Chiffre({ valeur, quoi, tone }: { valeur: string; quoi: string; tone?: "gold" }) {
  return (
    <Card shape="panel" tone={tone} className="flex flex-col gap-0.5 px-3.5 py-3.5">
      <span className={cn("text-[19px] leading-tight font-bold tracking-[-0.02em]", tone === "gold" && "text-gold-text")}>
        {valeur}
      </span>
      <span className="text-[11px] leading-tight text-muted">{quoi}</span>
    </Card>
  );
}
