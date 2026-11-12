# Tests HTTP et intégration

Les tests HTTP démarrent les vrais modules de `AppModule`, avec la même configuration Fastify, sessions, validation et filtres que `main.ts`.
Prisma, MySQL, le hachage Argon2 et Redis sont réels. La file d'emails est simulée dans les parcours HTTP pour ne pas envoyer de messages.
Le fichier `services.integration.spec-e2e.ts` vérifie aussi le vrai worker BullMQ avec Redis, un expéditeur SMTP simulé et une nouvelle tentative après erreur.

## Préparation

Depuis la racine du dépôt :

```sh
docker compose -f docker-compose.dev.yml up -d mysql-test redis-test
```

Dans `api/.env.test`, configurer `DATABASE_URL` vers la base dédiée `blog_test` sur `localhost:3307` et `SECRET_KEY` avec une clé de session de 32 octets encodée en base64.
Ne jamais utiliser les identifiants ou la base de production. La base est nettoyée entre les scénarios ; son nom doit contenir un segment `test` ou `e2e`, sinon l'exécution est refusée.
Redis utilise `redis://127.0.0.1:6380/0` par défaut. `E2E_REDIS_URL` permet de choisir une autre instance exclusivement réservée aux tests.

Depuis `api`, synchroniser le schéma de la base de test uniquement :

```sh
pnpm exec dotenv -e .env.test -- prisma db push --schema src/config/database/schema.merged.prisma --skip-generate
pnpm test:e2e
```

Sous PowerShell avec les scripts désactivés, utiliser `pnpm.cmd`.
Les suites sont exécutées avec un seul worker pour ne pas nettoyer la base pendant les tests d'une autre suite. Aucun `forceExit` ne masque les ressources restées ouvertes.
Les paramètres Argon2 sont réduits uniquement pour ces tests fonctionnels ; cela ne mesure pas la robustesse ou les performances des paramètres de production.

## Périmètre

- Authentification, sessions et déconnexion.
- Utilisateurs, droits de modification et de suppression, listes de publications et de brouillons.
- Articles : création, consultation, slugs, publication, modification, suppression, pagination et filtrage des lectures.
- Likes et suivi de lecture avec persistance et validation des données.
- Préférences : valeurs par défaut, sélection de champs, modification et isolation entre utilisateurs.
- Réinitialisation : demande d'email, confirmation, tokens invalides, expirés, associés à un autre email ou déjà consommés.
- Compte courant et métadonnées de formulaire.
- Services sans route HTTP directe : comptage, relation de like, visibilité du profil, rehashage, templates, cache Redis et worker BullMQ.

Les parcours testent les contrats présents. Ils ne constituent pas une preuve de couverture exhaustive, un audit de sécurité, ni une validation de livraison SMTP réelle. La consommation concurrente d'un token, son rollback, l'isolation des brouillons, les pseudos concurrents et les échecs définitifs du worker sont également testés.

Les tests vérifient également le rattachement des tokens au compte, leur révocation après modification des identifiants, la suppression en cascade et la réattribution d'une adresse email. Les scénarios de disponibilité couvrent une commande du limiteur qui reste en attente et une connexion Redis HTTP réellement déconnectée. Les valeurs utilisateur `null` sont testées séparément des champs omis.
