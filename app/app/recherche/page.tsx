import Link from "next/link";
import { Photo } from "@/components/ui/Photo";
import { ScreenHeader } from "@/components/mb/AppHeader";
import { Card } from "@/components/ui/Card";
import { SearchIcon } from "@/components/icons";
import { chercherPartout, type Trouvaille } from "@/lib/recherche";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Recherche" };

/**
 * Chercher dans toute l'application.
 *
 * Une seule barre, cinq familles de réponses — salles, soirées, tournois,
 * articles, joueurs. Le formulaire s'envoie en GET : l'adresse porte la
 * recherche, donc elle se partage et se retrouve dans l'historique.
 */
export default async function RecherchePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const terme = (q ?? "").trim();
  const moi = await requireUser();
  const res = await chercherPartout(terme, moi.id);

  return (
    <>
      <ScreenHeader title="Rechercher" subtitle="Une salle, une soirée, un tournoi, un article, un joueur." back="/app" />

      <form action="/app/recherche" className="flex items-center gap-2">
        <label className="glass flex h-12 grow items-center gap-2.5 rounded-full px-4">
          <SearchIcon size={17} className="shrink-0 text-muted" />
          <span className="sr-only">Que cherches-tu ?</span>
          <input
            name="q"
            defaultValue={terme}
            autoFocus
            placeholder="Salle, tournoi, puff, joueur…"
            className="h-full w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted"
          />
        </label>
        <button className="press h-12 shrink-0 rounded-full bg-gold px-5 text-[13px] font-semibold text-gold-ink">
          Chercher
        </button>
      </form>

      {terme.length < 2 ? (
        <Card tone="dashed" shape="panel" className="px-5 py-10 text-center text-[13px] text-muted">
          Tape au moins deux lettres — ou les six chiffres du code d&apos;un joueur.
        </Card>
      ) : res.total === 0 ? (
        <Card tone="dashed" shape="panel" className="px-5 py-10 text-center text-[13px] text-muted">
          Rien pour « {terme} ». Essaie le nom d&apos;une salle, d&apos;un quartier ou d&apos;un article.
        </Card>
      ) : null}

      <Famille titre="Salles" lignes={res.salles} />
      <Famille titre="Soirées" lignes={res.soirees} />
      <Famille titre="Tournois" lignes={res.tournois} />
      <Famille titre="Articles" lignes={res.articles} />
      <Famille titre="Joueurs" lignes={res.joueurs} ronde />
    </>
  );
}

function Famille({ titre, lignes, ronde }: { titre: string; lignes: Trouvaille[]; ronde?: boolean }) {
  if (lignes.length === 0) return null;
  return (
    <section className="flex flex-col gap-2.5">
      <h2 className="label-caps text-[10.5px] text-muted">{titre}</h2>
      <div className="flex flex-col gap-2 lg:grid lg:grid-cols-2 lg:gap-3">
        {lignes.map((l) => (
          <Link key={l.id} href={l.href} className="press block">
            <Card shape="panel" className="flex items-center gap-3 p-3">
              <span
                className={`relative h-11 w-11 shrink-0 overflow-hidden bg-surface-2 ${ronde ? "rounded-full" : "rounded-card"}`}
              >
                {l.image ? <Photo src={l.image} alt="" fill sizes="44px" className="object-cover" /> : null}
              </span>
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate text-[14px] font-semibold">{l.titre}</span>
                <span className="truncate text-[12px] text-muted">{l.detail}</span>
              </span>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
