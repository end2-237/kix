import Link from "next/link";
import Image from "next/image";
import { AdminNav } from "@/components/admin/AdminNav";
import { LockIcon, MasterMark } from "@/components/icons";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { signOut } from "@/lib/actions";
import { requireRole } from "@/lib/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireRole("admin");

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      {/* Sous le format bureau, cette colonne devient une simple barre de
          titre : la navigation passe en bas. Elle garde le compte et la
          déconnexion, qui n'existaient nulle part ailleurs — un
          administrateur sur tablette ne pouvait pas sortir. */}
      <aside className="flex shrink-0 flex-row items-center justify-between gap-3 border-b border-line bg-surface p-4 lg:w-64 lg:flex-col lg:items-stretch lg:gap-6 lg:border-r lg:border-b-0">
        <div className="flex items-center gap-2.5 lg:justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <MasterMark size={26} />
            <span className="flex flex-col">
              <span className="text-[14px] font-bold tracking-[0.14em] lg:text-[15px]">MASTER BREAK</span>
              <span className="text-[11px] text-muted">Administration</span>
            </span>
          </Link>
          <ThemeToggle className="hidden h-10 w-10 lg:grid" />
        </div>

        <div className="hidden lg:block">
          <AdminNav />
        </div>

        <div className="flex items-center gap-2 lg:mt-auto lg:flex-col lg:items-stretch lg:gap-3">
          <div className="glass flex items-center gap-2.5 rounded-card p-1.5 lg:p-3">
            {admin.avatar ? (
              <Image src={admin.avatar} alt={admin.name} width={36} height={36} className="h-8 w-8 rounded-full object-cover lg:h-9 lg:w-9" />
            ) : (
              <span className="grid h-8 w-8 place-items-center rounded-full bg-surface-2 text-[11px] font-semibold lg:h-9 lg:w-9">
                {admin.name.slice(0, 2).toUpperCase()}
              </span>
            )}
            <span className="hidden flex-col gap-0.5 lg:flex">
              <span className="text-[13px] font-semibold">{admin.name}</span>
              <span className="text-[11px] text-muted">Administrateur</span>
            </span>
          </div>

          <ThemeToggle className="h-10 w-10 lg:hidden" />

          <form action={signOut}>
            <button
              aria-label="Se déconnecter"
              className="grid h-10 w-10 place-items-center rounded-full border border-dashed border-line text-[11px] text-muted hover:text-dim lg:h-auto lg:w-full lg:rounded-full lg:px-4 lg:py-2.5"
            >
              <span className="lg:hidden" aria-hidden="true">
                <LockIcon size={15} />
              </span>
              <span className="hidden lg:inline">Se déconnecter</span>
            </button>
          </form>
        </div>
      </aside>

      {/* `pb-28` réserve la place du barreau flottant, qui masquait la
          dernière ligne des tableaux.

          `min-w-0` : un élément flex refuse par défaut de rétrécir sous la
          largeur de son contenu. Sans lui, un formulaire large poussait toute
          la page hors de l'écran sur une tablette — la barre latérale restait
          en place et c'est le contenu qui débordait. */}
      <main className="stagger flex min-w-0 grow flex-col gap-6 p-5 pb-28 lg:p-8 lg:pb-8">{children}</main>

      <AdminNav mobile />
    </div>
  );
}
