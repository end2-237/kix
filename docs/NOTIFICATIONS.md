# Les notifications

Deux couches, et la seconde n'existe que grâce à la première.

1. **En base** : chaque `notify()` écrit une ligne dans `mb.notifications`.
   C'est ce que montre `/app/notifications`, et c'est la source de vérité.
2. **Sur le téléphone** : un signal Web Push réveille le service worker, qui
   vient lire cette ligne et affiche la bulle — même application fermée.

## Deux chemins, au choix

L'application sait envoyer de deux façons, et choisit selon ce qui est
configuré :

| Chemin | Quand il sert | Ce qu'il demande |
| --- | --- | --- |
| **Standard (VAPID)** | par défaut | une paire de clés à nous |
| **Firebase (FCM)** | dès que le projet Firebase est branché | la config web, la clé Web Push, un compte de service |

Les deux aboutissent au même service worker, à la même table et au même
comportement. Ce qui change, c'est qui achemine le signal. Un compte peut
même avoir un téléphone enregistré d'une façon et un ordinateur de l'autre,
selon ce qui était configuré ce jour-là.

## Faut-il Firebase (FCM) ?

Pas nécessairement, et cela mérite une explication, parce que c'est la
première idée qui vient.

Le navigateur — Chrome, Firefox, Edge, et Safari depuis iOS 16.4 — expose la
même API standard : `PushManager.subscribe()`. Il rend un **endpoint** qui
pointe déjà vers le service de son éditeur :

| Navigateur | Où va l'endpoint |
| --- | --- |
| Chrome, Edge | `fcm.googleapis.com` — donc FCM, sans qu'on ait rien à faire |
| Firefox | `updates.push.services.mozilla.com` |
| Safari, Safari iOS | `web.push.apple.com` — APNs |

Autrement dit : **on passe déjà par FCM sur Chrome**. Le SDK Firebase n'est
qu'une enveloppe autour de cette API. L'adopter imposerait un projet Google,
une clé de serveur, un second service worker (`firebase-messaging-sw.js`) et
une dépendance de plusieurs centaines de kilo-octets — pour envoyer
exactement la même requête HTTP, et sans rien apporter sur Safari iOS, qui ne
parle pas à FCM.

Ce qu'il faut au minimum, c'est une paire de clés **VAPID** : elle identifie
l'expéditeur auprès de n'importe lequel de ces services. C'est tout.

Ce que Firebase apporte en plus, et qui peut valoir le détour : une console
où l'on voit les envois, des campagnes et des segments sans écrire de code,
et une seule API le jour où une application Android ou iOS native s'ajoute.
C'est un choix de confort d'exploitation, pas une nécessité technique.

## Le message part sans contenu

Le protocole permet de chiffrer une charge utile (aes128gcm : ECDH, HKDF,
AES-GCM). C'est la seule partie vraiment difficile, et elle n'apporte rien
ici : le service worker peut aller chercher la notification chez nous, avec le
cookie de session, par `GET /api/push/derniere`.

Conséquence agréable : ni Apple ni Google ne voient jamais ce que dit la
notification. Le signal qu'on leur confie est vide.

Si la lecture échoue — hors ligne, session expirée — le service worker affiche
un message de repli. iOS retire la permission à une application qui reçoit un
push sans rien montrer.

## Mise en route par Firebase

Dans la console Firebase, **Paramètres du projet** :

- onglet *Général* → la configuration de l'application web ;
- onglet *Cloud Messaging* → **Certificats Web Push**, bouton *Générer une
  paire de clés*. La chaîne de 87 caractères qui commence par `B` est la clé
  publique ;
- onglet *Comptes de service* → *Générer une nouvelle clé privée*. Le fichier
  JSON téléchargé est un **vrai secret**, contrairement à tout le reste.

```
NEXT_PUBLIC_FIREBASE_API_KEY=…
NEXT_PUBLIC_FIREBASE_PROJECT_ID=…
NEXT_PUBLIC_FIREBASE_APP_ID=…
NEXT_PUBLIC_FIREBASE_SENDER_ID=…
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=…       # facultatif, déduit du projet
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=…    # facultatif, déduit du projet
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=…    # active Analytics
NEXT_PUBLIC_FIREBASE_VAPID_KEY=B…        # la clé publique Web Push
FIREBASE_SERVICE_ACCOUNT=…               # le JSON, ou son encodage base64
```

Le compte de service se colle tel quel, ou encodé en base64 si l'hébergeur
mange les sauts de ligne :
`base64 -w0 service-account.json`.

### Ce qui est public, ce qui ne l'est pas

Tout ce qui commence par `NEXT_PUBLIC_` est **inliné dans le JavaScript
envoyé à chaque visiteur**. C'est voulu pour la configuration web Firebase :
la clé d'API identifie le projet, elle n'autorise rien à elle seule — ce sont
les règles de sécurité et les restrictions de clé, dans la console Google
Cloud, qui décident. Pensez à y poser une restriction par domaine.

Ce qui ne doit **jamais** porter ce préfixe : `FIREBASE_SERVICE_ACCOUNT` et
`VAPID_PRIVATE_KEY`. L'application refuse de démarrer ses envois si elle
trouve une clé privée dans la variable publique, et l'écrit dans le journal —
une clé privée fait 43 caractères, une publique 87 et commence par `B`.

## Mise en route sans Firebase

```
npm run push:cles
```

Pose les trois lignes rendues dans l'environnement du serveur :

```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=…   # envoyée au navigateur, pas un secret
VAPID_PRIVATE_KEY=…              # jamais dans le dépôt
VAPID_SUBJECT=mailto:contact@masterbreak.cm
```

**La clé publique doit exister au moment de la construction** : elle est
inlinée dans le code du navigateur. Dans Coolify, posez-la sur la ressource
avant de déployer.

Sans ces clés, tout continue de fonctionner : les notifications s'écrivent en
base et s'affichent dans l'application, seul le push part à la corbeille.

Changer de paire coupe **tous** les abonnements existants : les navigateurs ont
enregistré l'ancienne clé publique. On ne la régénère qu'en cas de fuite.

## iOS : l'installation d'abord

Sur iPhone, les notifications web ne fonctionnent **que** si le site a été
ajouté à l'écran d'accueil. Tant qu'on est dans l'onglet Safari, l'objet
`Notification` n'existe même pas.

L'application le détecte et montre la marche à suivre — bouton *Partager*,
puis *Sur l'écran d'accueil* — au lieu d'un bouton grisé qui ferait croire à
une panne.

Il faut aussi, et c'est en place :

- un manifeste valide, avec `display: standalone` et des icônes PNG ;
- `apple-touch-icon` en PNG **opaque** (iOS ne compose pas la transparence,
  qui devient noire) ;
- le site servi en HTTPS.

## Ce qui déclenche un push

Tout ce qui passe par `notify()`, sans exception : jetons crédités, commande
confirmée, billet émis, candidature retenue, tirage d'un tournoi, abonnement
réglé, et **un ami qui se met à jouer**.

L'envoi se fait hors transaction et sans `await` : une notification n'est pas
le sujet de la requête en cours, et un serveur d'Apple lent ne doit pas
retarder un paiement.

## Entretien

Un endpoint qui répond 404 ou 410 est supprimé : c'est la seule façon dont un
service de push nous dit qu'une installation a disparu.
