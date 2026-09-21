# La boîte de salle

Diffuser un match sur les écrans de la salle **sans internet** : seulement le wifi.

Tout le reste de Master Break passe par le VPS. Ici, non : faire sortir la vidéo
d'une table vers un serveur à l'étranger pour la faire revenir sur l'écran d'à
côté ajoute de la latence, coûte de la bande passante, et s'éteint à la première
coupure de fibre. La boîte règle ça — elle est *dans* la salle.

```
  caméra / téléphone ──RTMP ou WebRTC──▶  ┌─────────────────┐
                                          │  boîte de salle │  ──▶ téléviseur
  téléphone de l'arbitre ──HTTP──────────▶│  (Pi ou mini-PC)│  ──▶ téléviseur
                                          └─────────────────┘
        tout tient sur le routeur de la salle — aucun octet ne sort
```

## Ce qu'il faut

- Un mini-PC ou un Raspberry Pi 4/5, branché **en Ethernet** au routeur.
- Une IP fixe pour cette machine (réservation DHCP sur le routeur).
- Une source vidéo : encodeur HDMI, OBS sur un portable, ou simplement un
  téléphone posé sur un pied.
- Les téléviseurs : n'importe quel écran capable d'ouvrir une page web
  (Chromecast, Fire Stick, Smart TV, ou un second Pi en mode kiosque).

## Installation

```bash
git clone … && cd deploy/salle
echo "MB_SALLE_IP=192.168.1.50" > .env   # l'IP fixe de la boîte
docker compose up -d
```

`MB_SALLE_IP` n'est pas décoratif : c'est l'adresse que la boîte annonce aux
navigateurs de la salle pour le flux WebRTC. Mise à la mauvaise valeur, le score
s'affiche mais l'image reste noire.

## Les trois adresses

| Qui | Ouvre |
|---|---|
| Le téléviseur | `http://192.168.1.50:7000/` |
| L'arbitre | `http://192.168.1.50:7000/arbitre` |
| La caméra (OBS, Larix, encodeur) | `rtmp://192.168.1.50/table1` |
| Un téléphone qui filme | `http://192.168.1.50:8889/table1/publish` |

Plusieurs tables : `table2`, `table3`… Lance une boîte par écran
(`MB_SALLE_PORT` et `MB_SALLE_PATH` différents), ou une seule boîte et autant
de chemins MediaMTX.

## Ce qui tient sans internet

- La vidéo de la table sur les écrans, avec ~0,5 s de retard en WebRTC.
- Le score, poussé du téléphone de l'arbitre vers tous les écrans, en direct.
- Le panneau de fin de match.
- **Le redémarrage** : chaque geste est écrit dans `journal.json` avant d'être
  appliqué. Coupure de courant en pleine finale → la boîte revient sur le même
  score.

## Ce qui a encore besoin d'internet

- La diffusion aux spectateurs **hors de la salle** (c'est le VPS et son
  MediaMTX public).
- Les paiements, billets, réservations, le compte des joueurs.
- La remontée du match vers la plateforme : **pas encore écrite.** Aujourd'hui
  le journal local reste local. Le lien boîte → VPS (rejouer la frise en file
  d'attente dès que la connexion revient) est le prochain morceau.

## Sécurité

Le MediaMTX de la boîte n'a **pas** d'authentification, et c'est délibéré : il
n'est joignable que depuis le wifi de la salle. Ne redirige jamais les ports
1935 / 8888 / 8889 depuis la box internet — le serveur public du VPS est là pour
ça, avec son contrôle d'accès.
