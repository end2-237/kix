import Link from "next/link";
import Image from "next/image";
import { MasterMark } from "@/components/icons";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { signOut } from "@/lib/actions";
import { requireRole } from "@/lib/session";

const links = [
  { href: "/admin", label: "Tableau de bord" },
  { href: "/admin/salles", label: "Salles" },
  { href: "/admin/packs", label: "Packs de jetons" },
  { href: "/admin/produits", label: "Produits" },
  { href: "/admin/commandes", label: "Commandes" },
  { href: "/admin/evenements", label: "Événements" },
  { href: "/admin/jetons", label: "Jetons & recharges" },
  { href: "/admin/utilisateurs", label: "Utilisateurs" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireRole("admin");

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <aside className="flex shrink-0 flex-col gap-6 border-b border-line bg-surface p-4 lg:w-64 lg:border-r lg:border-b-0">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2.5">
            <MasterMark size={28} />
            <span className="flex flex-col">
              <span className="text-[15px] font-bold tracking-[0.14em]">MASTER BREAK</span>
              <span className="text-[11px] text-muted">Administration</span>
            </span>
          </Link>
          <ThemeToggle className="h-10 w-10" />
        </div>

        <nav className="flex flex-wrap gap-1 lg:flex-col">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-4 py-2.5 text-[13px] text-dim transition hover:bg-surface-2 hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto hidden flex-col gap-3 lg:flex">
          <div className="glass flex items-center gap-2.5 rounded-card p-3">
            {admin.avatar ? (
              <Image src={admin.avatar} alt={admin.name} width={36} height={36} className="h-9 w-9 rounded-full object-cover" />
            ) : (
              <span className="grid h-9 w-9 place-items-center rounded-full bg-surface-2 text-[11px] font-semibold">
                {admin.name.slice(0, 2).toUpperCase()}
              </span>
            )}
            <span className="flex flex-col gap-0.5">
              <span className="text-[13px] font-semibold">{admin.name}</span>
              <span className="text-[11px] text-muted">Administrateur</span>
            </span>
          </div>
          <form action={signOut}>
            <button className="w-full rounded-full border border-dashed border-line px-4 py-2.5 text-[11px] text-muted hover:text-dim">
              Se déconnecter
            </button>
          </form>
        </div>
      </aside>

      <main className="stagger flex grow flex-col gap-6 p-5 lg:p-8">{children}</main>
    </div>
  );
}
