import Link from "next/link";
import { ScreenHeader } from "@/components/mb/AppHeader";
import { NewStreamButton, StreamAdmin, type StreamRow } from "@/components/live/StreamAdmin";
import { DemandeRetrait } from "@/components/caisse/Retrait";
import { Card } from "@/components/ui/Card";
import { BoltIcon, CoinIcon } from "@/components/icons";
import { createStream } from "@/lib/actions";
import { getVenues } from "@/lib/queries";
import {
  accessLabel,
  getSoldeDiffuseur,
  getStreamsDuJoueur,
  ingest,
  levelLabel,
  media,
  type StreamAccess,
  type StreamLevel,
} from "@/lib/stream";
import { RETRAIT_MINIMUM, getSoldeRetirableVendeur } from "@/lib/caisse";
import { NIVEAU_DIFFUSION, ilManque, nomDuNiveau, peutDiffuser } from "@/lib/niveaux";
import { requireUser } from "@/lib/session";
import { fcfa } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Diffuser" };

/**
 * Diffuser depuis son téléphone, et en vivre un peu.
 *
 * Filmer une table était réservé au comptoir. C'est désormais un privilège de
 * classement : à partir de « Cogneur », un joueur pose son téléphone sur un
 * trépied, ouvre son direct, et touche sa part des billets vidéo. La même
 * bourse que les cours et la boutique — un seul solde, un seul guichet.
 */
export default async function Diffuser() {
  const moi = await requireUser();
  const habilite = moi.role !== "client" || peutDiffuser(moi.points);

  const [mesDirects, gains, solde, salles] = await Promise.all([
    getStreamsDuJoueur(moi.id),
    getSoldeDiffuseur(moi.id),
    getSoldeRetirableVendeur(moi.id),
    getVenues(),
  ]);

  if (!habilite && mesDirects.length === 0) {
    return (
      <>
        <ScreenHeader title="Diffuser" subtitle="Filmer une table, et la montrer." back="/app/rewards" />
        <Card tone="dashed" shape="panel" className="flex flex-col gap-2 px-5 py-8">
          <h2 className="text-[15px]">Pas encore</h2>
          <p className="text-[13px] leading-6 text-muted">
            Ouvrir un direct s&apos;obtient au niveau {nomDuNiveau(NIVEAU_DIFFUSION)}. Il te manque{" "}
            <span className="text-ink">{ilManque(moi.points, NIVEAU_DIFFUSION)} points</span> — le temps de
            quelques soirées à la table.
          </p>
          <Link href="/app/live" className="press w-fit text-[12.5px] text-gold-text">
            Voir les directs en cours →
          </Link>
        </Card>
      </>
    );
  }

  const rows: StreamRow[] = mesDirects.map(({ stream }) => ({
    id: stream.id,
    title: stream.title,
    level: stream.level,
    levelLabel: levelLabel[stream.level as StreamLevel] ?? stream.level,
    access: stream.access,
    accessLabel: accessLabel[stream.access as StreamAccess] ?? stream.access,
    price: stream.price,
    status: stream.status,
    viewers: stream.viewers,
    peakViewers: stream.peakViewers,
    match: null,
    ingest: ingest(stream),
  }));

  return (
    <>
      <ScreenHeader
        title="Mes directs"
        subtitle="Filme une table, et touche ta part des billets vidéo."
        back="/app/rewards"
      />

      <div className="grid grid-cols-3 gap-2.5">
        <Chiffre valeur={String(mesDirects.length)} quoi={mesDirects.length > 1 ? "directs ouverts" : "direct ouvert"} />
        <Chiffre valeur={String(gains.billets)} quoi={gains.billets > 1 ? "billets vendus" : "billet vendu"} />
        <Chiffre valeur={fcfa(gains.net)} quoi="gagnés" tone="gold" />
      </div>

      <Card shape="panel" className="flex flex-col gap-3 p-4">
        <span className="flex items-center gap-2 text-[13.5px] font-semibold">
          <CoinIcon size={16} /> Ce que tu peux retirer
        </span>
        <p className="text-[12px] text-muted">
          {fcfa(gains.brut)} de billets vidéo, moins {fcfa(gains.commission)} de commission. Tes cours et tes
          ventes comptent dans la même bourse.
        </p>
        <DemandeRetrait disponible={solde.disponible} minimum={RETRAIT_MINIMUM} phone={moi.phone} />
      </Card>

      {!media().configured ? (
        <Card tone="dashed" shape="square" className="px-4 py-3.5 text-[12.5px] text-muted">
          Le serveur média n&apos;est pas branché : les directs se créent, mais rien ne partira tant que la salle
          n&apos;aura pas ouvert sa diffusion.
        </Card>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-[14px] font-semibold">
          <BoltIcon size={16} /> Ouvrir un direct
        </span>
        <NewStreamButton
          matches={[]}
          salles={salles.map((v) => ({ id: v.id, label: v.name }))}
          onCreate={async (form) => {
            "use server";
            const result = await createStream(form);
            return result.ok ? { ok: true } : { ok: false, error: result.error };
          }}
        />
      </div>

      {rows.length === 0 ? (
        <Card tone="dashed" shape="panel" className="px-5 py-8 text-center text-[13px] text-muted">
          Tu n&apos;as encore rien diffusé. Un téléphone posé sur un trépied suffit.
        </Card>
      ) : (
        <StreamAdmin rows={rows} />
      )}
    </>
  );
}

function Chiffre({ valeur, quoi, tone }: { valeur: string; quoi: string; tone?: "gold" }) {
  return (
    <Card shape="panel" tone={tone} className="flex flex-col gap-0.5 px-3 py-3.5">
      <span className={`text-[18px] leading-tight font-bold tracking-[-0.02em] ${tone === "gold" ? "text-gold-text" : ""}`}>
        {valeur}
      </span>
      <span className="text-[11px] leading-tight text-muted">{quoi}</span>
    </Card>
  );
}
