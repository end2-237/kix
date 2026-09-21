import Link from "next/link";
import Image from "next/image";
import { AdminNav } from "@/components/admin/AdminNav";
import { MasterMark } from "@/components/icons";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { signOut } from "@/lib/actions";
import { requireRole } from "@/lib/session";

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

        <div className="hidden lg:block">
          <AdminNav />
        </div>

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

      {/* `pb-28` : le barreau flottant ne doit pas masquer la dernière ligne
          d'un tableau — c'est exactement ce qu'il faisait avant. */}
      <main className="stagger flex grow flex-col gap-6 p-5 pb-28 lg:p-8 lg:pb-8">{children}</main>

      <AdminNav mobile />
    </div>
  );
}
