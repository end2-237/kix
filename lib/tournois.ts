/**
 * Les mots d'un tournoi, sans base de données.
 *
 * Les libellés servent des deux côtés : les consoles d'organisation, rendues
 * sur le serveur, et le formulaire du candidat, rendu dans le navigateur.
 * `lib/tournaments.ts` est marqué `server-only` — ces tables-là ne peuvent
 * donc pas y vivre, sinon le formulaire emporterait la base avec lui.
 */

export const DISCIPLINES: Record<string, string> = {
  "8-ball": "8-ball · rayés ou pleins",
  "9-ball": "9-ball",
  snooker: "Snooker",
  killer: "Killer",
};

/** Comment se joue un tournoi. */
export const FORMATS: Record<string, string> = {
  direct: "Élimination directe",
  poules: "Poules puis tableau",
};

export const ETATS: Record<string, string> = {
  brouillon: "Brouillon",
  inscriptions: "Inscriptions ouvertes",
  complet: "Inscriptions closes",
  encours: "En cours",
  termine: "Terminé",
  annule: "Annulé",
};

export const NIVEAUX: Record<string, string> = {
  debutant: "Débutant",
  intermediaire: "Intermédiaire",
  confirme: "Confirmé",
};

/** L'état d'une candidature, tel qu'on l'annonce. */
export const CANDIDATURES: Record<string, string> = {
  candidat: "En attente",
  accepte: "Retenu",
  refuse: "Non retenu",
  retire: "Retiré",
};
