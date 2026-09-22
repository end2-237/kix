import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, venues } from "@/db";
import { ConsoleTournoi } from "@/components/tournoi/Console";
import { getTournamentById } from "@/lib/tournaments";
import { getAllVenues } from "@/lib/queries";
import { requireRole } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTournamentById(id);
  return { title: t?.title ?? "Tournoi" };
}

export default async function AdminTournoi({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireRole("admin");
  const tournoi = await getTournamentById(id);
  if (!tournoi) notFound();

  const [venue, salles] = await Promise.all([
    tournoi.venueId
      ? db.select().from(venues).where(eq(venues.id, tournoi.venueId)).limit(1).then((r) => r[0] ?? null)
      : Promise.resolve(null),
    getAllVenues(),
  ]);

  return (
    <ConsoleTournoi
      tournoi={tournoi}
      venue={venue}
      retour="/admin/tournois"
      salles={[{ value: "", label: "Aucune salle" }, ...salles.map((v) => ({ value: v.id, label: v.name }))]}
    />
  );
}
