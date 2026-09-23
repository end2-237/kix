import Link from "next/link";
import { SearchIcon } from "@/components/icons";

/**
 * La barre de recherche du rayon.
 *
 * C'était une loupe qui ne faisait rien. C'est maintenant un formulaire qui
 * s'envoie en GET : la recherche vit dans l'adresse, elle se partage, elle
 * survit au retour arrière, et elle fonctionne sans une ligne de JavaScript —
 * ce qui compte sur un téléphone d'entrée de gamme en bord de réseau.
 */
export function RechercheBoutique({ q, cat }: { q: string; cat: string }) {
  return (
    <form action="/app/shop" className="flex items-center gap-2">
      <input type="hidden" name="cat" value={cat} />
      <label className="glass flex h-11 grow items-center gap-2.5 rounded-full px-4">
        <SearchIcon size={17} className="shrink-0 text-muted" />
        <span className="sr-only">Chercher un article</span>
        <input
          name="q"
          defaultValue={q}
          placeholder="Puff, gomme, queue de billard…"
          className="h-full w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted"
        />
      </label>
      <button className="press h-11 shrink-0 rounded-full bg-gold px-4 text-[13px] font-semibold text-gold-ink">
        Chercher
      </button>
      {q ? (
        <Link
          href={`/app/shop?cat=${cat}`}
          className="press h-11 shrink-0 rounded-full border border-line px-3.5 text-[12.5px] leading-[44px] text-muted"
        >
          Effacer
        </Link>
      ) : null}
    </form>
  );
}
