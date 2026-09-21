import Link from "next/link";

export const metadata = { title: "Page introuvable" };

/**
 * La page qu'on voit quand l'adresse ne mène nulle part.
 *
 * Sans elle, Next servait la sienne : « This page could not be found », en
 * anglais, sur fond blanc, au milieu d'une application française et sombre.
 * C'est aussi ce que voit quelqu'un qui tente l'adresse d'une salle qui n'est
 * pas la sienne — autant que ce soit une porte fermée, pas un bug apparent.
 */
export default function Introuvable() {
  return (
    <div className="grid min-h-dvh place-items-center bg-bg px-6 text-center">
      <div className="flex max-w-md flex-col items-center gap-5">
        <span className="text-[13px] tracking-[0.3em] text-gold-text uppercase">Master Break</span>

        <div className="flex flex-col gap-2">
          <h1 className="text-[26px] lg:text-[32px]">Rien à cette adresse</h1>
          <p className="text-[14px] leading-6 text-muted">
            La page a peut-être changé de nom, ou tu n&apos;as pas accès à celle-ci. Les deux se ressemblent de
            l&apos;extérieur.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <Link
            href="/app"
            className="flex h-12 items-center rounded-full bg-gold px-6 text-sm font-semibold text-gold-ink"
          >
            Retour à l&apos;accueil
          </Link>
          <Link
            href="/direct"
            className="flex h-12 items-center rounded-full border border-line px-6 text-sm text-dim hover:text-ink"
          >
            Voir les directs
          </Link>
        </div>
      </div>
    </div>
  );
}
