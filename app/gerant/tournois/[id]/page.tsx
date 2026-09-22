import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, venues } from "@/db";
import { ConsoleTournoi } from "@/components/tournoi/Console";
import { getTournamentById } from "@/lib/tournaments";
import { requireRole } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTournamentById(id);
  return { title: t?.title ?? "Tournoi" };
}

export default async function GerantTournoi({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const manager = await requireRole("manager", "admin");
  const tournoi = await getTournamentById(id);
  if (!tournoi) notFound();
  if (manager.role === "manager" && tournoi.venueId !== manager.venueId) redirect("/gerant?refus=1");

  const venue = tournoi.venueId
    ? ((await db.select().from(venues).where(eq(venues.id, tournoi.venueId)).limit(1))[0] ?? null)
    : null;

  return <ConsoleTournoi tournoi={tournoi} venue={venue} retour="/gerant/tournois" />;
}
