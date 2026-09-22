/**
 * La phase de poules.
 *
 * Au billard comme ailleurs, un tournoi à élimination directe renvoie la
 * moitié des joueurs chez eux après un seul match. Une salle qui fait venir
 * seize personnes un samedi soir ne peut pas se le permettre : on joue donc
 * d'abord des poules, où chacun rencontre tout le monde, puis un tableau
 * entre les qualifiés.
 *
 * Trois règles, qui viennent de la pratique et non de l'informatique :
 *
 *  · Les têtes de série se répartissent en serpentin. Les quatre meilleurs
 *    ouvrent les quatre poules, les quatre suivants les remplissent à
 *    l'envers : sans cela, la poule A concentrerait tous les favoris.
 *
 *  · Le classement d'une poule se lit d'abord aux victoires, puis à la
 *    différence de manches, puis aux manches gagnées. Deux joueurs qui
 *    restent à égalité sont départagés par leur confrontation directe —
 *    c'est ce que réclame le premier joueur venu, et il a raison.
 *
 *  · Un premier de poule ne doit pas retrouver au premier tour du tableau
 *    quelqu'un qu'il vient d'affronter en poule. C'est l'appariement du
 *    tableau qui commande l'ordre des qualifiés, et non l'inverse.
 */

export type DuelPoule = { groupe: number; slot: number; a: string; b: string };

/**
 * Combien de poules pour ce nombre de joueurs.
 *
 * `taille` est un maximum, pas une moyenne : un organisateur qui écrit
 * « poules de 4 » n'en veut pas une de cinq. On arrondit donc au-dessus.
 *
 * Mais on ne descend jamais sous trois joueurs par poule : une poule de deux
 * est un match unique, et sortir deux qualifiés d'une poule de deux ne
 * qualifie rien du tout. Treize joueurs par quatre font donc 4+3+3+3, et cinq
 * joueurs font une seule poule de cinq.
 */
export function nombreDePoules(joueurs: number, taille: number): number {
  if (joueurs < 2) return 0;
  const cible = Math.max(2, taille);
  let nb = Math.max(1, Math.ceil(joueurs / cible));
  while (nb > 1 && Math.floor(joueurs / nb) < 3) nb--;
  return nb;
}

/**
 * La répartition en serpentin.
 *
 * `joueurs` arrive dans l'ordre des têtes de série. On distribue une poule
 * après l'autre, puis on repart en sens inverse — d'où le nom.
 */
export function repartirEnPoules(joueurs: string[], nbPoules: number): string[][] {
  const poules: string[][] = Array.from({ length: Math.max(1, nbPoules) }, () => []);
  joueurs.forEach((j, i) => {
    const tour = Math.floor(i / poules.length);
    const place = i % poules.length;
    poules[tour % 2 === 0 ? place : poules.length - 1 - place].push(j);
  });
  return poules;
}

/** Tous contre tous, dans une poule. */
export function duelsDeLaPoule(groupe: number, joueurs: string[]): DuelPoule[] {
  const duels: DuelPoule[] = [];
  let slot = 0;
  for (let i = 0; i < joueurs.length; i++) {
    for (let k = i + 1; k < joueurs.length; k++) {
      duels.push({ groupe, slot: slot++, a: joueurs[i], b: joueurs[k] });
    }
  }
  return duels;
}

export type ResultatPoule = {
  playerId: string;
  joues: number;
  victoires: number;
  defaites: number;
  manchesPour: number;
  manchesContre: number;
  difference: number;
};

export type DuelJoue = {
  aId: string;
  bId: string;
  scoreA: number;
  scoreB: number;
  termine: boolean;
};

/**
 * Le classement d'une poule.
 *
 * Les joueurs sont donnés dans l'ordre des têtes de série : à égalité
 * parfaite, c'est ce rang qui tranche en dernier recours, faute de quoi
 * l'ordre dépendrait de la base de données.
 */
export function classerLaPoule(joueurs: string[], duels: DuelJoue[]): ResultatPoule[] {
  const table = new Map<string, ResultatPoule>(
    joueurs.map((id) => [
      id,
      { playerId: id, joues: 0, victoires: 0, defaites: 0, manchesPour: 0, manchesContre: 0, difference: 0 },
    ]),
  );

  for (const d of duels) {
    if (!d.termine) continue;
    const a = table.get(d.aId);
    const b = table.get(d.bId);
    if (!a || !b) continue;

    a.joues++; b.joues++;
    a.manchesPour += d.scoreA; a.manchesContre += d.scoreB;
    b.manchesPour += d.scoreB; b.manchesContre += d.scoreA;
    if (d.scoreA > d.scoreB) { a.victoires++; b.defaites++; }
    else if (d.scoreB > d.scoreA) { b.victoires++; a.defaites++; }
  }

  for (const r of table.values()) r.difference = r.manchesPour - r.manchesContre;

  const rang = new Map(joueurs.map((id, i) => [id, i]));

  return [...table.values()].sort((x, y) => {
    if (y.victoires !== x.victoires) return y.victoires - x.victoires;
    if (y.difference !== x.difference) return y.difference - x.difference;
    if (y.manchesPour !== x.manchesPour) return y.manchesPour - x.manchesPour;

    // La confrontation directe : celui qui a battu l'autre passe devant.
    const face = duels.find(
      (d) => d.termine && ((d.aId === x.playerId && d.bId === y.playerId) || (d.aId === y.playerId && d.bId === x.playerId)),
    );
    if (face) {
      const gagnant = face.scoreA > face.scoreB ? face.aId : face.bId;
      if (gagnant === x.playerId) return -1;
      if (gagnant === y.playerId) return 1;
    }
    return (rang.get(x.playerId) ?? 0) - (rang.get(y.playerId) ?? 0);
  });
}

/**
 * L'ordre des qualifiés à l'entrée du tableau.
 *
 * Tous les premiers de poule d'abord, dans l'ordre des poules, puis tous les
 * deuxièmes dans le même ordre. Cela tient au tableau, qui apparie la tête de
 * série 1 avec la dernière, la 2 avec l'avant-dernière : avec quatre poules et
 * deux qualifiés, A1 tombe alors sur D2, B1 sur C2 — jamais sur son propre
 * deuxième.
 *
 * J'avais d'abord renversé une ligne sur deux, en croyant éloigner les
 * coéquipiers de poule ; cela les plaçait exactement aux deux positions que le
 * tableau apparie, et les quatre quarts de finale rejouaient les quatre
 * poules. Le test le dit maintenant en appariant vraiment le tableau, au lieu
 * de mesurer une distance dans la liste.
 */
export function ordreDesQualifies(classements: ResultatPoule[][], parPoule: number): string[] {
  const sortis: string[] = [];
  for (let rang = 0; rang < parPoule; rang++) {
    for (const poule of classements) {
      const id = poule[rang]?.playerId;
      if (id) sortis.push(id);
    }
  }
  return sortis;
}

/** Le nom d'une poule : A, B, C… — jamais « poule 1 », que personne ne dit. */
export const nomDeLaPoule = (groupe: number) =>
  groupe <= 26 ? String.fromCharCode(64 + groupe) : `P${groupe}`;
