import Link from "next/link";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { TargetIcon } from "@/components/icons";
import { acceptScoringInvite, inspectScoringInvite } from "@/lib/actions";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Invitation d'arbitrage" };

/**
 * Le lien d'invitation n'ouvre pas un droit anonyme : il propose au compte
 * connecté de prendre la feuille, et c'est son geste qui l'inscrit. Le gérant
 * voit alors qui arbitre, et peut le retirer.
 */
export default async function InvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  await requireUser();
  const invite = await inspectScoringInvite(decodeURIComponent(token));

  if (!invite.ok) {
    return (
      <Card shape="panel" className="flex flex-col items-center gap-4 px-5 py-10 text-center">
        <h1 className="text-[22px]">Invitation refusée</h1>
        <p className="text-[13px] text-muted">{invite.error}</p>
        <Link
          href="/arbitre"
          className="press flex h-12 items-center rounded-full bg-gold px-5 text-sm font-semibold text-gold-ink"
        >
          Mes feuilles de match
        </Link>
      </Card>
    );
  }

  async function accept() {
    "use server";
    const result = await acceptScoringInvite(decodeURIComponent(token));
    if (result.ok) redirect(`/arbitre/${result.matchId}`);
    redirect("/arbitre");
  }

  return (
    <Card shape="panel" className="flex flex-col items-center gap-5 px-5 py-9 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-full bg-gold/15 text-gold-text">
        <TargetIcon size={24} />
      </span>

      <div className="flex flex-col gap-2">
        <h1 className="text-[22px]">On te confie la feuille</h1>
        <p className="text-[14px]">
          {invite.a} <span className="text-muted">vs</span> {invite.b}
        </p>
        <p className="text-[12.5px] text-muted">
          {invite.label} · {invite.venue}
          {invite.scope === "event" ? " · tout le tournoi" : ""}
        </p>
      </div>

      <p className="text-[12px] leading-5 text-muted">
        En acceptant, ton nom apparaît comme arbitre et chaque point saisi est horodaté à ton nom.
      </p>

      <form action={accept} className="w-full">
        <button className="press go flex h-13 w-full items-center justify-center gap-2 rounded-full bg-gold text-[14px] font-semibold text-gold-ink">
          Prendre la feuille
        </button>
      </form>

      <Link href="/arbitre" className="text-[12px] text-muted underline-offset-4 hover:text-ink hover:underline">
        Non merci
      </Link>
    </Card>
  );
}
