import { Photo } from "@/components/ui/Photo";
import Link from "next/link";
import { GerantNav } from "@/components/mb/GerantNav";
import { MasterMark, ChevronDownIcon } from "@/components/icons";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { signOut } from "@/lib/actions";
import { getVenue } from "@/lib/queries";
import { db, venues } from "@/db";
import { eq } from "drizzle-orm";
import { requireRole } from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * Le poste du gérant : barre latérale sur grand écran, onglets en bas sur
 * téléphone. La garde vit ici, donc avant le premier octet de HTML — le refus
 * est une vraie redirection et non un saut côté client.
 */
export default async function GerantLayout({ children }: { children: React.ReactNode }) {
  const manager = await requireRole("manager", "admin");
  const venue = manager.venueId
    ? (await db.select().from(venues).where(eq(venues.id, manager.venueId)).limit(1))[0]
    : null;

  return (
    <div className="flex min-h-dvh">
      <aside className="hidden w-62 shrink-0 flex-col gap-6 border-r border-line bg-surface p-4 lg:flex">
        <Link href="/" className="flex items-center gap-2.5 px-2">
          <MasterMark />
          <span className="flex flex-col gap-px">
            <span className="text-base font-bold tracking-[0.14em]">MASTER SCAN</span>
            <span className="text-[11px] text-muted">Espace gérant</span>
          </span>
        </Link>

        <div className="glass flex items-center gap-2.5 rounded-card p-3">
          {venue ? (
            <Photo
              src={venue.image}
              alt={venue.name}
              width={36}
              height={36}
              className="h-9 w-9 rounded-full object-cover"
            />
          ) : null}
          <span className="flex grow flex-col gap-0.5">
            <span className="text-[13px] font-semibold">{venue?.name ?? "Toutes les salles"}</span>
            <span className="text-[11px] text-muted">
              {venue ? `${venue.tables} tables · ${venue.area}` : "accès administration"}
            </span>
          </span>
          <ChevronDownIcon size={14} className="text-muted" />
        </div>

        <GerantNav />

        <div className="mt-auto flex flex-col gap-3">
          <div className="glass flex items-center gap-2.5 rounded-card p-3">
            {manager.avatar ? (
              <Photo
                src={manager.avatar}
                alt={manager.name}
                width={36}
                height={36}
                className="h-9 w-9 rounded-full object-cover"
              />
            ) : null}
            <span className="flex grow flex-col gap-0.5">
              <span className="text-[13px] font-semibold">{manager.name}</span>
              <span className="text-[11px] text-gold-text">Poste 1 · en ligne</span>
            </span>
            <ThemeToggle className="h-9 w-9" />
          </div>
          <form action={signOut}>
            <button className="w-full rounded-full border border-dashed border-line px-4 py-2.5 text-[11px] text-muted hover:text-dim">
              Se déconnecter
            </button>
          </form>
        </div>
      </aside>

      <main className="flex min-h-0 min-w-0 grow flex-col gap-5 overflow-hidden p-5 pb-24 lg:p-7 lg:pb-7">{children}</main>

      <GerantNav mobile />
    </div>
  );
}

/** Réexporté pour que les pages n'aient pas à refaire la requête. */
export { getVenue };
