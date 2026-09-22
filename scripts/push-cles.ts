import { nouvellesCles } from "@/lib/vapid";

/**
 * Génère une paire VAPID. `npm run push:cles`
 *
 * La publique part dans `NEXT_PUBLIC_VAPID_PUBLIC_KEY` — elle est envoyée au
 * navigateur, ce n'est pas un secret. La privée reste sur le serveur, dans
 * l'environnement, jamais dans le dépôt.
 *
 * Changer de paire coupe tous les abonnements existants : les navigateurs ont
 * enregistré l'ancienne clé publique, et leur service de push refusera nos
 * envois. On ne la régénère donc qu'en cas de fuite, et on prévient.
 */
const { publique, privee } = nouvellesCles();

console.log(`
Ajoute ces deux lignes à l'environnement du serveur :

NEXT_PUBLIC_VAPID_PUBLIC_KEY=${publique}
VAPID_PRIVATE_KEY=${privee}
VAPID_SUBJECT=mailto:contact@masterbreak.cm

La publique doit être présente **à la construction** : elle est inlinée dans
le code du navigateur.
`);
