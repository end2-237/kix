/**
 * Les mots d'un groupe, sans base de données.
 *
 * `lib/bande.ts` est marqué `server-only` : ces libellés-là ne peuvent pas y
 * vivre, sinon le formulaire du chef — rendu dans le navigateur — emporterait
 * la base avec lui. Même partage que pour les tournois.
 */

/**
 * Les trois portes d'un groupe.
 *
 * Elles disent ce qui arrive quand quelqu'un touche « Rejoindre » : il entre,
 * il demande, ou on lui répond que c'est sur invitation. Le chef seul en
 * décide, et le libellé se lit partout au même endroit.
 */
export const PORTES: Record<string, { nom: string; detail: string }> = {
  ouvert: { nom: "Ouvert à tous", detail: "N'importe quel joueur peut entrer sans rien demander." },
  approbation: { nom: "Sur approbation", detail: "Le joueur demande, le chef accepte ou refuse." },
  invitation: { nom: "Sur invitation", detail: "On n'entre que si un membre vous invite." },
};

export const PORTES_OPTIONS = Object.entries(PORTES).map(([value, p]) => ({ value, label: p.nom }));
