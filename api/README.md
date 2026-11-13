# API du blog

NestJS, Fastify, Prisma/MySQL, sessions chiffrées, Argon2, Redis et BullMQ.

## Installation

Node.js 22 ou ultérieur et pnpm 10 sont nécessaires. Depuis api :

```sh
pnpm install --frozen-lockfile
cp .env.example .env
pnpm prisma:build
pnpm prisma:generate
pnpm prisma:deploy
pnpm start:dev
```

Configurer MySQL, Redis et SMTP avant le démarrage. SECRET_KEY contient 32 octets aléatoires encodés en base64. Garder ARGON2_PEPPER secret et stable après la création des comptes.

## Permissions des articles

Les listes publiques affichent les publications par défaut. published=false exige une session. Les brouillons sont accessibles uniquement à leur auteur ou à un administrateur actuel en base : listes, détail par identifiant ou slug, brouillons utilisateur, likes et suivi de lecture.

Un détail interdit répond 404 ; les listes ne comptent pas les brouillons interdits. Les méthodes internes non filtrées du service sont réservées aux traitements déjà autorisés.

## Récupération du mot de passe

FRONTEND_URL détermine le lien /auth/reset, avec email et token encodés. L'en-tête Origin ne détermine jamais cette URL.

Une transaction MySQL supprime le token sous condition (email, code, expiration), puis modifie le mot de passe. Deux requêtes concurrentes ne peuvent pas consommer le même token. Une erreur de modification du compte annule aussi sa consommation.

BullMQ effectue cinq tentatives avec un délai exponentiel initial d'une seconde. Un échec de rendu ou de mise en file supprime le token correspondant. Après un échec définitif du worker, seul le token associé au job est supprimé, sans toucher à un nouveau token.

Une réponse positive de /password/forgot confirme la mise en file, pas la livraison SMTP. Une interruption peut entraîner un nouvel envoi : aucune garantie d'envoi exactement une fois. MySQL et Redis ne partagent pas de transaction distribuée ; l'expiration protège les tokens abandonnés après une interruption brutale entre ces opérations.

## Migrations et pseudos

Modifier les fragments dans src/config/database/models, puis lancer prisma:build et prisma:generate.

La migration 20261112000100_unique_user_pseudo crée un index unique. Les conflits concurrents produisent une réponse 409. L'unicité respecte la collation MySQL de la colonne, notamment sa sensibilité à la casse.

```sh
pnpm prisma:check-duplicates
pnpm prisma:deploy
```

Le déploiement contrôle les doublons et s'arrête s'il en trouve. Résoudre manuellement ces comptes avant de relancer ; aucun utilisateur n'est supprimé automatiquement.

La chaîne de migrations a été validée sur une base de test dédiée. La nouvelle migration n'a pas été appliquée à une base de développement ou de production pendant cette correction.

## Qualité et tests

```sh
pnpm lint
pnpm typecheck
pnpm build
pnpm test:unit --runInBand
pnpm test:e2e
pnpm test:all
```

lint ne modifie rien ; lint:fix applique les corrections automatiques. Les types any et variables inutilisées hérités produisent des avertissements ; les erreurs ESLint font échouer la commande.

`test:all` exécute les tests unitaires puis les E2E et affiche un récapitulatif avec icônes : tests réussis, échoués, ignorés, à écrire, nombre de suites et durée totale. Les deux phases sont exécutées même si la première échoue ; la commande conserve un code de sortie en échec si une phase échoue ou reste incomplète. Les nombres proviennent des rapports Jest.

Le build produit dist/main.js et copie les templates d'emails. Les tests sont exclus du livrable. Voir [la préparation des tests HTTP et intégration](src/test/e2e/README.md) : ils nettoient exclusivement une base dédiée.

## Production Docker

Renseigner api/.env pour SMTP et Argon2. Fournir à Compose MYSQL_ROOT_PASSWORD, MYSQL_PASSWORD, SECRET_KEY et FRONTEND_URL (HTTPS) dans l'environnement ou via --env-file.

Le mot de passe MySQL est incorporé à DATABASE_URL : utiliser un secret aléatoire compatible URL, par exemple hexadécimal, sans caractères réservés.

Depuis la racine :

```sh
docker compose -f docker-compose.prod.yml config --quiet
docker compose -f docker-compose.prod.yml up --build -d
```

La composition déploie l'API, MySQL et Redis. Le frontend Angular se déploie séparément. L'API est exposée sur 127.0.0.1:3000 et nécessite un reverse proxy HTTPS. Le frontend et l'API doivent être sur le même site pour les cookies SameSite=Lax. CORS accepte l'origine FRONTEND_URL avec credentials.

Les cookies sont HttpOnly et Secure en production. Le démarrage refuse les variables obligatoires manquantes et un FRONTEND_URL sans HTTPS.

L'image Node 22 s'exécute avec l'utilisateur node. Son démarrage vérifie les doublons, applique les migrations puis lance node dist/main.js. Une base existante doit disposer d'un historique Prisma cohérent ; ne pas baseliner automatiquement une base remplie.

## Logs et arrêt

Un logger partagé réutilise ses transports. Les écritures fichiers sont séquencées et attendues avant la fermeture des flux. LOG_DIR remplace le dossier logs_files par défaut.

Les mois clos depuis 30 jours sont archivés automatiquement au format `.tar.gz`. Les commandes de consultation, recherche, export, épinglage et suppression sont décrites dans [LOGS.md](LOGS.md). Depuis la racine : `pnpm logs --help`.

SIGTERM et SIGINT déclenchent l'arrêt NestJS et la fermeture du worker, de Redis et du logger. Prévoir un volume ou une collecte externe pour conserver les logs au-delà de la durée de vie du conteneur.

## Durcissement des accès et des comptes

Chaque requête portant une session vérifie l'existence du compte, son rôle actuel et une empreinte du hash de son mot de passe. Un changement ou une réinitialisation du mot de passe invalide tous les cookies précédents. Les cookies créés avant cette protection nécessitent une nouvelle connexion. Aucune migration de schéma supplémentaire n'est nécessaire pour cette vérification.

La suppression d'un article revérifie également le rôle en base. La pagination trie par date de création décroissante puis par identifiant décroissant, afin de départager les dates identiques.

L'inscription, la modification et la réinitialisation acceptent des nouveaux mots de passe d'au moins 12 caractères. Les anciens mots de passe plus courts restent utilisables pour se connecter.

Le pepper est lu par injection de ConfigService et devient obligatoire en production. Si des anciens hashes ont été produits avec la chaîne littérale `undefined` à cause du précédent chargement prématuré, ces comptes nécessitent une récupération de mot de passe. Ne pas remplacer un pepper existant valide.

Le renouvellement d'un token expiré utilise une transaction avec suppression conditionnelle. Une demande concurrente ne peut pas supprimer un nouveau token actif. Les conflits de transaction sont retentés au maximum trois fois.

La récupération retourne la même réponse HTTP 200 et le même message pour un compte inconnu, un compte existant et un token déjà actif. Un token actif ne déclenche pas un deuxième email. Cela masque la différence fonctionnelle ; les temps de réponse et les erreurs d'infrastructure ne sont pas rendus indistinguables.

### Limitation partagée des requêtes

Les compteurs Redis sont atomiques et communs aux instances de production. Ils sont appliqués avant les traitements de hachage et d'envoi. Une réponse 429 fournit Retry-After ; une panne Redis ne désactive pas silencieusement la protection.

| Route POST               | Limite par IP | Limite par email | Fenêtre    |
| ------------------------ | ------------- | ---------------- | ---------- |
| /auth/login              | 20            | 10               | 1 minute   |
| /auth/register et /users | 5 par route   | —                | 1 minute   |
| /password/forgot         | 5             | 3                | 15 minutes |
| /password/reset          | 10            | 5                | 1 minute   |

Par défaut, l'IP provient de la connexion directe. Derrière un reverse proxy, renseigner TRUSTED_PROXY avec ses seules adresses ou plages CIDR, séparées par des virgules. Ne pas accepter arbitrairement X-Forwarded-For depuis Internet. Sans cette configuration, les utilisateurs derrière le même proxy partagent la limite par IP.

Les suites fonctionnelles augmentent ces plafonds uniquement avec NODE_ENV=test et isolent leurs compteurs par application. Un test dédié active E2E_REAL_RATE_LIMITS=true pour vérifier les seuils de production.

## Liaison des tokens et disponibilité Redis

La migration `20261112000200_bind_recovery_token_to_user` invalide les liens de récupération existants, puis rattache chaque nouveau token à un compte avec une clé étrangère et une contrainte unique sur `userId`. Elle ne modifie ni ne supprime les utilisateurs. Les personnes ayant un ancien lien doivent refaire une demande après le déploiement.

La suppression d'un utilisateur supprime automatiquement son token. Une modification d'email ou de mot de passe révoque les tokens dans la même transaction que la modification du compte. L'émission et la consommation verrouillent d'abord le compte concerné, afin de se synchroniser avec ces opérations. La réinitialisation vérifie l'identifiant du compte et l'email du lien : une adresse réattribuée à un autre compte ne transfère pas les anciens droits de récupération.

Le limiteur utilise une connexion Redis dédiée aux requêtes HTTP, avec une attente maximale de 1 500 ms par commande, une file hors connexion désactivée et des tentatives bornées. Une échéance applicative couvre aussi une commande qui ne se termine pas. Une indisponibilité produit une réponse 503 avec Retry-After, sans exécuter l'action protégée. La connexion persistante du worker conserve sa configuration distincte.

Les champs utilisateur omis restent optionnels ; les valeurs explicitement `null` sont rejetées en HTTP 400 avant tout accès d'écriture à Prisma.
