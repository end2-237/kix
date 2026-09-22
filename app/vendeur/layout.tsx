import { Photo } from "@/components/ui/Photo";
import Link from "next/link";
import { VendeurNav } from "@/components/vendeur/VendeurNav";
import { MasterMark } from "@/components/icons";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { signOut } from "@/lib/actions";
import { requireRole } from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * L'espace d'un vendeur.
 *
 * La boutique était tenue par l'administrateur seul : un article
 * n'appartenait à personne. Un vendeur a maintenant sa porte, ses articles et
 * son solde. La garde vit ici, donc avant le premier octet de HTML.
 */
export default async function VendeurLayout({ children }: { children: React.ReactNode }) {
  const vendeur = await requireRole("seller", "admin");

  return (
    <div className="flex min-h-dvh">
      <aside className="hidden w-62 shrink-0 flex-col gap-6 border-r border-line bg-surface p-4 lg:flex">
        <Link href="/" className="flex items-center gap-2.5 px-2">
          <MasterMark />
          <span className="flex flex-col gap-px">
            <span className="text-base font-bold tracking-[0.14em]">MASTER SHOP</span>
            <span className="text-[11px] text-muted">Espace vendeur</span>
          </span>
        </Link>

        <VendeurNav />

        <div className="mt-auto flex flex-col gap-3">
          <div className="glass flex items-center gap-2.5 rounded-card p-3">
            {vendeur.avatar ? (
              <Photo
                src={vendeur.avatar}
                alt={vendeur.name}
                width={36}
                height={36}
                className="h-9 w-9 rounded-full object-cover"
              />
            ) : (
              <span className="grid h-9 w-9 place-items-center rounded-full bg-surface-2 text-[11px] font-semibold">
                {vendeur.name.slice(0, 2).toUpperCase()}
              </span>
            )}
            <span className="flex grow flex-col gap-0.5">
              <span className="text-[13px] font-semibold">{vendeur.name}</span>
              <span className="text-[11px] text-muted">Vendeur</span>
            </span>
            <ThemeToggle className="h-9 w-9" />
          </div>
          <form action={signOut}>
            <button className="h-11 w-full rounded-full border border-line text-[13px] text-dim transition hover:text-ink">
              Se déconnecter
            </button>
          </form>
        </div>
      </aside>

      {/* `pb-28` réserve la place du barreau flottant : sans lui, il masquait
          la dernière ligne de chaque liste. */}
      <main className="stagger flex min-w-0 grow flex-col gap-5 p-5 pb-28 lg:p-8 lg:pb-8">{children}</main>

      <VendeurNav mobile />
    </div>
  );
}
