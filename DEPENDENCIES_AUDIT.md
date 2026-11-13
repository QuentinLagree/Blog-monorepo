# Vérification des dépendances — 13 novembre 2026

## Mise à jour effectuée

- TypeScript installé : **5.8.3 → 5.9.3**, dans `api` et `web` ; déclaration `~5.9.3`.
- TypeScript 7 n’a pas été retenu : le compilateur Angular 20.3 et ts-jest installés exigent une version inférieure à 6.
- Retrait de `ignoreDeprecations: "6.0"` dans `api/tsconfig.json` : cette valeur est invalide avec TypeScript 5.9.
- Relèvement des versions minimales des outils web vers les versions déjà installées : `@angular/build` et `@angular-devkit/build-angular` 20.3.20, `@angular/compiler` et `@angular/compiler-cli` 20.3.18, `angular-eslint` 20.7.0, `typescript-eslint` 8.57.1. Les anciennes résolutions du lockfile web n’étaient pas compatibles avec TypeScript 5.9.
- Synchronisation du lockfile du workspace et des lockfiles autonomes API et web. La résolution autonome web a également actualisé des dépendances transitives ; elle doit être distinguée de l’installation workspace testée.
- Régénération du client Prisma après le changement de résolution des peer dependencies. Aucune migration ni modification de base hors des tests.

Compatibilité Angular : [table officielle](https://angular.dev/reference/versions). Les contraintes des packages effectivement installés ont aussi été consultées.

## Résultat de l’audit de sécurité du workspace

L’audit exécuté après l’installation de TypeScript signale **366 alertes** :

| Gravité | Nombre |
| --- | ---: |
| Critique | 13 |
| Élevée | 155 |
| Modérée | 167 |
| Faible | 31 |

Ces nombres incluent les dépendances transitives et les outils de développement. Ils ne représentent pas 366 failles distinctes et exploitables dans l’application. La classification production/développement du rapport est insuffisante : il faut examiner les chemins et les usages. Cet audit ne constitue pas une correction des alertes.

### Priorités à examiner

| Dépendance | Observation | Suite à donner |
| --- | --- | --- |
| `handlebars` | Version installée 4.7.8 ; correctifs annoncés en 4.7.10 pour plusieurs alertes critiques | Actualiser dans la branche 4 et vérifier les templates d’emails et les dépendances transitives |
| `fastify` | Version installée 5.8.2 ; registre consulté : 5.12.8 | Examiner les avis et actualiser la branche 5 avec tests HTTP et plugins |
| `nodemailer` | Version installée 7.0.13 ; alertes directes et transitives | Vérifier les versions corrigées et la compatibilité avec le module mailer avant migration |
| Angular | Plusieurs avis touchent core, common et compiler | Examiner les correctifs disponibles dans la branche 20 et aligner les packages Angular |
| `liquidjs`, `shell-quote`, `@xhmikosr/decompress`, `websocket-driver`, `tar`, `piscina`, `proxy-addr` | Présents parmi les alertes critiques transitives | Identifier les parents et actualiser ceux-ci ; éviter des overrides majeurs sans validation |
| `dompurify`, `mermaid`, `vite`, `node-forge` | Plusieurs alertes transitives | Identifier les fonctionnalités ou outils concernés et leur exposition réelle |

Avis critiques de référence : [Handlebars](https://github.com/advisories/GHSA-8r5x-fm3f-whwj), [LiquidJS](https://github.com/advisories/GHSA-gf2q-c269-pqgc), [Piscina](https://github.com/advisories/GHSA-67c8-pqhq-4rmx).

## Cohérence et maintenance

- `@types/helmet` est déprécié : Helmet fournit ses types. Vérifier les usages avant retrait.
- La configuration `pnpm.onlyBuiltDependencies` de l’API est ignorée dans le workspace ; seule la configuration racine est prise en compte. Des scripts Prisma sont actuellement ignorés lors de l’installation, d’où la génération explicite du client.
- Les lockfiles autonomes et celui du workspace peuvent diverger. Définir à terme une stratégie unique pour les installations locales et Docker.
- Le CLI Angular reste en 20.1 tandis que les outils de compilation installés sont en 20.3 ; prévoir leur alignement.
- La contrainte API `node >=22` autorise également des versions non testées ; les types Node API ciblent 22 et ceux du frontend 20, alors que la session utilise Node 24.13.0.
- Certaines versions plus récentes exigent des migrations séparées : Jest, Prisma, Angular, ngx-markdown, ESLint, ioredis et Nodemailer. Elles n’ont pas été migrées automatiquement.

## Vérifications et limite connue

- TypeScript installé et utilisé : 5.9.3 des deux côtés.
- Typage et compilation API validés après régénération Prisma.
- Compilation Angular en configuration development validée ; compilation production non évaluée ici.
- ESLint API : aucune erreur, 46 avertissements ; ESLint Angular validé.
- Prettier API validé.
- Lors de la vérification suivante, le formatage de `header.html` et la configuration Jasmine/Karma ont été corrigés : Prettier web validé et **5 tests navigateur réussis sur 5** avec Chrome Headless.
- Tests API après correction des configurations TypeScript : **311 unitaires réussis sur 311** et **200 E2E réussis sur 200**. Le test obsolète de `/me/metadata` a été retiré pour correspondre à la suppression de cette route dans le contrôleur.
- `baseUrl` retiré de TypeScript ; résolution et modules API en `NodeNext`. Le répertoire de base nécessaire à SWC est défini séparément dans `api/.swcrc`. Les tests utilisent le mode isolé et leurs signatures décorées importent explicitement les types.
- Les fragments Prisma déclarent maintenant les relations inverses `postReads`, déjà présentes dans le schéma généré ; cela préserve leur nom lors de la génération au démarrage Docker.
- Les packages runtime Angular déclarent désormais au minimum 20.3.18 pour éviter le mélange 20.1/20.3 dans le lockfile autonome Docker. La compilation applicative exclut les fichiers de bootstrap des tests.
- Docker de développement : API sur Node 22 ; migrations et seed destructeur retirés du démarrage automatique. Les installations au démarrage utilisent les lockfiles gelés et le contexte de construction web exclut les dépendances et caches locaux.
- Le lockfile autonome web est aligné sur le graphe de dépendances du workspace validé, y compris les peer dependencies Angular. La compilation Angular 20.3.18 dans Docker a été confirmée.

Commandes utiles : `pnpm -r outdated`, `pnpm audit`, `pnpm --dir api run test:all`, `pnpm --dir api run typecheck`, `pnpm --dir web run check:tests`.
