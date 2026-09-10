import Image from "next/image";
import Link from "next/link";
import { KixMark } from "@/components/icons";
import { Card } from "@/components/ui/Card";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { signIn } from "@/lib/actions";
import { listAccounts } from "@/lib/session";

export const metadata = { title: "Connexion" };

const roleLabels: Record<string, { label: string; hint: string }> = {
  client: { label: "Client", hint: "app mobile, jetons, shop, billets" },
  manager: { label: "Gérant", hint: "KIX Scan, caisse de la salle" },
  admin: { label: "Administration", hint: "catalogue, salles, revenus" },
};

export default async function ConnexionPage({ searchParams }: { searchParams: Promise<{ refus?: string }> }) {
  const [{ refus }, accounts] = await Promise.all([searchParams, listAccounts()]);

  return (
    <div className="relative min-h-dvh overflow-hidden px-5 py-10">
      <div className="halo halo-green -top-40 -left-20 h-100 w-100" />

      <div className="relative mx-auto flex w-full max-w-lg flex-col gap-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <KixMark size={30} />
            <span className="text-[15px] font-semibold tracking-[0.2em] uppercase">KIX</span>
          </Link>
          <ThemeToggle />
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-[34px]">Choisis ton compte</h1>
          <p className="text-[14px] leading-6 text-muted">
            Démonstration sans mot de passe : l&apos;authentification par SMS arrivera avec Supabase.
            {refus ? " Ce compte n'a pas accès à cette page." : ""}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {accounts.map((account) => {
            const role = roleLabels[account.role] ?? roleLabels.client;
            return (
              <form key={account.id} action={signIn}>
                <input type="hidden" name="userId" value={account.id} />
                <button className="w-full text-left">
                  <Card className="flex items-center gap-3.5 px-4 py-3.5 transition hover:bg-surface-2">
                    {account.avatar ? (
                      <Image
                        src={account.avatar}
                        alt={account.name}
                        width={46}
                        height={46}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <span className="grid h-12 w-12 place-items-center rounded-full bg-surface-2 text-[13px] font-semibold">
                        {account.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                    <span className="flex grow flex-col gap-0.5">
                      <span className="text-[15px] font-semibold">{account.name}</span>
                      <span className="text-[12px] text-muted">{role.hint}</span>
                    </span>
                    <span className="rounded-full border border-line px-3 py-1.5 text-[11px] tracking-[0.1em] text-muted uppercase">
                      {role.label}
                    </span>
                  </Card>
                </button>
              </form>
            );
          })}
        </div>

        <p className="text-[12px] text-muted">
          Numéros de démonstration · +237 6 77 45 12 08 (client), 6 99 12 03 45 (gérant).
        </p>
      </div>
    </div>
  );
}
