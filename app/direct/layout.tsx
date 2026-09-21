import { AppSidebar } from "@/components/mb/AppSidebar";
import { BottomNav } from "@/components/mb/BottomNav";
import { LiveRail, type RailItem } from "@/components/live/LiveRail";
import { disciplineLabel, getShowcase } from "@/lib/stream";
import { getBalance, getUnreadCount } from "@/lib/queries";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * La vitrine des directs a sa propre coquille : contrairement au reste de
 * l'app, elle prend toute la largeur et garde la colonne des salles en cours
 * sous la main, comme une page de chaînes.
 */
export default async function DirectLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const [balance, unread, showcase] = await Promise.all([
    getBalance(user.id),
    getUnreadCount(user.id),
    getShowcase(),
  ]);

  const rail: RailItem[] = showcase.rail.map(({ stream, venue, match }) => ({
    id: stream.id,
    title: stream.title,
    venue: venue.name,
    image: venue.image,
    category: match ? `${match.a} vs ${match.b}` : (disciplineLabel[stream.discipline] ?? stream.discipline),
    viewers: stream.viewers,
  }));

  return (
    <div className="relative flex min-h-dvh">
      <AppSidebar user={user} balance={balance} unread={unread} />
      <LiveRail items={rail} />

      <div className="min-w-0 grow px-5 pt-4 pb-32 lg:px-7 lg:pt-6 lg:pb-14">{children}</div>

      <BottomNav />
    </div>
  );
}
