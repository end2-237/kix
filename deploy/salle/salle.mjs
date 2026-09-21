#!/usr/bin/env node
/**
 * Master Break — la boîte de salle.
 *
 * Un petit serveur qui tient une soirée entière sans internet : la caméra
 * publie sur le MediaMTX local, l'écran de la salle lit ce même flux, et
 * l'arbitre marque depuis son téléphone. Tout reste sur le réseau de la salle.
 *
 * Aucune dépendance : Node et rien d'autre. Ça tourne sur un Raspberry Pi.
 *
 *   node salle.mjs
 *   → écran   : http://<ip-de-la-boite>:7000/
 *   → arbitre : http://<ip-de-la-boite>:7000/arbitre
 *
 * Chaque geste est écrit dans `journal.json` avant d'être appliqué : une
 * coupure de courant en pleine finale ne coûte pas le score.
 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ici = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.MB_SALLE_PORT ?? 7000);
const JOURNAL = process.env.MB_SALLE_JOURNAL ?? path.join(ici, "journal.json");

/** Adresse du MediaMTX local, telle que la verra le navigateur de l'écran. */
const MEDIA = process.env.MB_SALLE_MEDIA ?? "";
const CHEMIN = process.env.MB_SALLE_PATH ?? "table1";

/* ------------------------------------------------------------------- état */

const vide = () => ({
  a: { nom: "Joueur A", score: 0 },
  b: { nom: "Joueur B", score: 0 },
  cible: 5,
  discipline: "8-ball",
  titre: "",
  main: "a",
  statut: "attente", // attente | encours | fini
  vainqueur: null,
  frise: [],
  maj: Date.now(),
});

let etat = charger();

function charger() {
  try {
    const brut = JSON.parse(fs.readFileSync(JOURNAL, "utf8"));
    // Une boîte redémarrée en pleine soirée doit retrouver son match.
    if (brut && brut.a && brut.b) return brut;
  } catch {
    /* premier démarrage, ou journal illisible : on repart propre */
  }
  return vide();
}

function enregistrer() {
  etat.maj = Date.now();
  try {
    fs.writeFileSync(JOURNAL, JSON.stringify(etat, null, 2));
  } catch (e) {
    console.error("[salle] journal non écrit :", e.message);
  }
  diffuser();
}

/* ------------------------------------------------------- flux vers l'écran */

const abonnes = new Set();

function diffuser() {
  const message = `event: etat\ndata: ${JSON.stringify(etat)}\n\n`;
  for (const client of abonnes) {
    try {
      client.write(message);
    } catch {
      abonnes.delete(client);
    }
  }
}

/* ----------------------------------------------------------------- gestes */

const noter = (quoi, qui, detail = "") => {
  etat.frise.unshift({
    quoi,
    qui,
    detail,
    a: etat.a.score,
    b: etat.b.score,
    a_: new Date().toISOString(),
  });
  etat.frise = etat.frise.slice(0, 60);
};

const gestes = {
  lancer() {
    etat.statut = "encours";
    noter("debut", null, "Coup d'envoi");
  },

  manche({ joueur, delta = 1 }) {
    if (etat.statut !== "encours") return;
    const cote = joueur === "b" ? "b" : "a";
    etat[cote].score = Math.max(0, etat[cote].score + Number(delta));
    etat.main = cote === "a" ? "b" : "a";
    noter(delta > 0 ? "manche" : "retrait", cote);

    if (delta > 0 && etat[cote].score >= etat.cible) {
      etat.statut = "fini";
      etat.vainqueur = cote;
      etat.main = null;
      noter("fin", cote, "Fin de match");
    }
  },

  fait({ joueur, quoi }) {
    if (etat.statut !== "encours") return;
    if (!["faute", "casse", "securite", "empochage"].includes(quoi)) return;
    const cote = joueur === "b" ? "b" : "a";
    if (quoi === "faute" || quoi === "securite") etat.main = cote === "a" ? "b" : "a";
    noter(quoi, cote);
  },

  terminer() {
    if (etat.statut === "fini") return;
    etat.statut = "fini";
    etat.vainqueur = etat.a.score === etat.b.score ? null : etat.a.score > etat.b.score ? "a" : "b";
    etat.main = null;
    noter("fin", null, "Fin de match");
  },

  regler({ a, b, cible, discipline, titre }) {
    if (typeof a === "string" && a.trim()) etat.a.nom = a.trim().slice(0, 40);
    if (typeof b === "string" && b.trim()) etat.b.nom = b.trim().slice(0, 40);
    if (cible) etat.cible = Math.min(21, Math.max(1, Number(cible)));
    if (discipline) etat.discipline = String(discipline).slice(0, 20);
    if (typeof titre === "string") etat.titre = titre.slice(0, 60);
  },

  nouveau({ a, b, cible, discipline, titre }) {
    const noms = { a: a ?? etat.a.nom, b: b ?? etat.b.nom };
    etat = vide();
    gestes.regler({ ...noms, cible, discipline, titre });
  },
};

/* ---------------------------------------------------------------- serveur */

const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css" };

function fichier(res, nom) {
  try {
    const corps = fs.readFileSync(path.join(ici, nom));
    res.writeHead(200, { "content-type": TYPES[path.extname(nom)] ?? "application/octet-stream" });
    res.end(corps);
  } catch {
    res.writeHead(404).end("introuvable");
  }
}

const serveur = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://boite");

  // L'écran et l'arbitre sont sur le même réseau : pas de secret à protéger.
  res.setHeader("access-control-allow-origin", "*");
  if (req.method === "OPTIONS") {
    return res.writeHead(204, { "access-control-allow-headers": "content-type", "access-control-allow-methods": "POST, GET" }).end();
  }

  if (url.pathname === "/") return fichier(res, "ecran.html");
  if (url.pathname === "/arbitre") return fichier(res, "arbitre.html");

  if (url.pathname === "/config") {
    return res
      .writeHead(200, { "content-type": "application/json" })
      .end(JSON.stringify({ media: MEDIA, chemin: CHEMIN }));
  }

  if (url.pathname === "/etat" && req.method === "GET") {
    res.writeHead(200, {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      "x-accel-buffering": "no",
    });
    res.write(`event: etat\ndata: ${JSON.stringify(etat)}\n\n`);
    abonnes.add(res);
    req.on("close", () => abonnes.delete(res));
    return;
  }

  if (url.pathname === "/geste" && req.method === "POST") {
    let corps = "";
    for await (const morceau of req) {
      corps += morceau;
      if (corps.length > 4096) return res.writeHead(413).end();
    }

    let demande;
    try {
      demande = JSON.parse(corps || "{}");
    } catch {
      return res.writeHead(400, { "content-type": "application/json" }).end('{"erreur":"json"}');
    }

    const geste = gestes[demande.geste];
    if (!geste) return res.writeHead(400, { "content-type": "application/json" }).end('{"erreur":"geste inconnu"}');

    geste(demande);
    enregistrer();
    return res.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify(etat));
  }

  res.writeHead(404).end("introuvable");
});

// Un battement régulier garde les écrans connectés à travers les proxys et
// les coupures de veille des téléviseurs.
setInterval(() => {
  for (const client of abonnes) {
    try {
      client.write(": ping\n\n");
    } catch {
      abonnes.delete(client);
    }
  }
}, 20_000);

serveur.listen(PORT, () => {
  console.log(`[salle] écran   → http://<ip-de-la-boite>:${PORT}/`);
  console.log(`[salle] arbitre → http://<ip-de-la-boite>:${PORT}/arbitre`);
  console.log(`[salle] média   → ${MEDIA || "non configuré (MB_SALLE_MEDIA)"} · chemin ${CHEMIN}`);
});
