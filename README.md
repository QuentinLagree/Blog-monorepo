# Blog-monorepo

# 📚 Table des matières

- [📖 Présentation](#presentation)
- [🚀 Fonctionnalités](#fonctionnalites)
- [🏗️ Architecture](#architecture)
- [🛠️ Stack technique](#stack)
- [⚙️ Installation](#install)
- [📦 Scripts](#script)
- [🔒 Sécurité](#security)
- [🧠 Difficultés rencontrées](#difficulty)
- [📚 Ce que j'ai appris](#what_learn)
- [🚧 Roadmap](#roadmap)

### Plateforme de blog Full Stack développée avec **Angular** et **NestJS**

<a id="presentation"></a>

# 📖 Présentation

Ce projet a pour objectif de reproduire une application de blog moderne tout en mettant en pratique des concepts avancés de développement Full Stack tels que :

- Architecture modulaire
- Principes SOLID
- Authentification
- API REST
- Gestion des rôles
- Redis & BullMQ
- Docker
- Prisma ORM
- Éditeur Markdown avec préview
- Gestion des brouillons

---

📸 Aperçu de l'application

[!NOTE]
L'interface est encore en cours d'amélioration. Certains éléments visuels peuvent évoluer au fil du développement.

🏠 Page d'accueil

La page d'accueil permet de consulter les articles publiés par la communauté, avec leur auteur, leur date de publication et une courte description.

<p align="center"> <img width="800" alt="Page d'accueil du blog." src="https://github.com/user-attachments/assets/05b326e8-fcee-4b48-92e5-a6a07b660454" />
 </p>

📖 Lecture d'un article

La page de détail affiche le contenu Markdown de l'article, son auteur, sa date de publication, son temps de lecture ainsi qu'un sommaire permettant de naviguer rapidement entre les différentes sections.

<p align="center"> <img src="https://github.com/user-attachments/assets/3a43a7b2-6477-4ea6-b722-90e81f68da9a" alt="Page de lecture d'un article" width="800" /> </p>

✍️ Éditeur Markdown

L'éditeur permet de rédiger un article en Markdown tout en visualisant le résultat en temps réel. Il prend également en charge les brouillons, la coloration syntaxique et l'ajout d'images locales.

<p align="center"> <img src="https://github.com/user-attachments/assets/4707baa4-dc8c-40e2-927e-94360b8c161a" alt="Éditeur Markdown avec prévisualisation" width="800" /> </p>

👤 Espace utilisateur

L'espace personnel permet de consulter les informations du compte, de retrouver ses brouillons et de gérer ses propres publications.

<p align="center"> <img src="https://github.com/user-attachments/assets/4b3bfbb4-b35b-4e9f-8462-3e9da56f40ef" alt="Espace personnel de l'utilisateur" width="800" /> </p>

🔐 Authentification

L'application dispose d'un système complet d'authentification comprenant la création de compte, la connexion, la vérification de l'adresse email et la réinitialisation du mot de passe.

<p align="center"> <img src="https://github.com/user-attachments/assets/e1598cd1-1c74-4234-8039-48d50bf557aa" alt="Page d'authentification" width="800" /> </p>

<a id="fonctionnalites"></a>

# 🚀 Fonctionnalités

## Gestion des utilisateurs

- Création de compte
- Connexion
- Déconnexion
- Vérification d'email
- Réinitialisation du mot de passe
- Gestion des rôles

---

## Gestion des articles

- Création
- Modification
- Suppression
- Brouillons
- Publication
- Pagination

---

## Éditeur Markdown

- Prévisualisation en temps réel
- Coloration syntaxique PrismJS
- Gestion des images locales
- Re-liaison automatique des images

---

## Backend

- API REST
- DTO
- Validation des données
- Guards
- Sessions
- BullMQ
- Redis
- Prisma

---
<a id="architecture"></a>

# 🏗️ Architecture

```
Blog-monorepo
│
├── api
│   ├── modules
│   ├── commons
│   ├── prisma
│   └── ...
│
├── web
│   ├── src
│   ├── shared
│   ├── commons
│   └── ...
│
├── docker-compose.dev.yml
├── docker-compose.prod.yml
└── pnpm-workspace.yaml
```

---
<a id="stack"></a>

# 🛠️ Stack technique

## Frontend

- Angular
- TypeScript
- SCSS
- Signals
- RxJS

---

## Backend

- NestJS
- Fastify
- Prisma ORM
- Jest / Supertest

---

## Base de données

- MySQL

---

## Infrastructure

- Docker
- Redis
- BullMQ

---

## Outils

- Git
- PNPM
- SwaggerUI
- Figma

---

# 🎯 Choix techniques

## Pourquoi Angular ?

J'ai commencé par apprendre React, mais je n'ai pas vraiment accroché à sa façon de développer, notamment avec le JSX. J'avais l'impression que beaucoup de choix d'architecture reposaient sur le développeur ou l'équipe.

En découvrant Angular, j'ai tout de suite apprécié le cadre qu'il propose. Le framework impose une architecture claire avec des composants, des services, l'injection de dépendances et une séparation des responsabilités. C'est une façon de développer qui me correspond davantage.

J'apprécie également l'utilisation de TypeScript et des Signals, que je trouve simples et agréables à utiliser pour gérer l'état de l'application.

Enfin, Angular s'intègre naturellement avec NestJS. Les deux frameworks partagent de nombreux concepts comme les décorateurs, les services, l'injection de dépendances et une architecture modulaire. Cela me permet de conserver une manière de travailler cohérente entre le frontend et le backend.

## Pourquoi NestJS ?

J'ai choisi NestJS parce que je voulais apprendre un framework backend structuré. Ce qui m'a attiré, c'est son architecture modulaire, l'injection de dépendances, les DTO, les Guards et, plus généralement, le fait qu'il encourage de bonnes pratiques de conception.

J'apprécie également sa proximité avec Angular. Les deux frameworks utilisent TypeScript, les décorateurs, les services et l'injection de dépendances. Quand je passe du frontend au backend, je retrouve une manière de travailler cohérente, ce qui rend le développement plus fluide.

Enfin, j'utilise Fastify comme adaptateur avec NestJS. Je n'ai donc pas choisi NestJS parce qu'il remplace Express ou Fastify, mais parce que son architecture correspond à ma façon de développer : elle est claire, modulaire et facilite la maintenance d'un projet qui grandit.

## Pourquoi Prisma ?

Au départ, j'ai utilisé Sequelize pour découvrir les ORM. Cependant, j'ai rapidement rencontré des difficultés, notamment sur la gestion des relations entre les modèles. En cherchant une alternative, j'ai découvert Prisma.

J'ai apprécié son approche basée sur un schéma unique (schema.prisma), qui rend la modélisation de la base de données plus claire. Les migrations sont simples à gérer, les relations sont plus intuitives à définir et le client généré est entièrement typé en TypeScript. Cela réduit les erreurs et améliore l'expérience de développement.

Aujourd'hui, Prisma est l'ORM avec lequel je suis le plus à l'aise, même si je reste ouvert à découvrir d'autres solutions selon les besoins d'un projet.

## Pourquoi Docker ?

Au début, j'installais directement mes dépendances comme MySQL ou Redis sur ma machine. En découvrant Docker, j'ai compris l'intérêt de disposer d'un environnement de développement reproductible.

Aujourd'hui, mon application, ma base de données MySQL, Redis et RedisInsight sont conteneurisés. Grâce à Docker Compose, je peux lancer tout mon environnement avec une seule commande, sans avoir à installer ou configurer chaque service sur la machine.

C'est également un avantage lorsque je change d'ordinateur ou si un autre développeur souhaite travailler sur le projet : tout le monde utilise exactement le même environnement, ce qui évite les problèmes liés aux différences de configuration.

Enfin, Docker simplifie aussi le déploiement puisque l'application est exécutée dans un environnement très proche de celui utilisé pendant le développement.

## Pourquoi Redis ?

J'ai choisi Redis principalement parce que j'utilise BullMQ pour gérer les traitements asynchrones, comme l'envoi d'emails. BullMQ s'appuie sur Redis pour stocker les jobs, leur état, les retries ou encore les délais d'exécution.

Au-delà de BullMQ, Redis est une base de données en mémoire extrêmement rapide. Même si aujourd'hui je l'utilise principalement pour la file d'attente, il pourrait aussi servir à mettre en cache certaines données ou à stocker des informations temporaires si le projet évoluait.

Je l'ai donc intégré pour apprendre à utiliser une technologie très présente dans les architectures modernes, tout en répondant à un besoin concret de mon application.

## Pourquoi BullMQ ?

J'utilise BullMQ pour gérer les traitements asynchrones de mon application, notamment l'envoi d'emails.

Sans BullMQ, l'utilisateur devrait attendre que le serveur termine l'envoi du mail avant de recevoir une réponse. Avec une file d'attente, je peux répondre immédiatement à la requête, puis laisser un worker traiter l'envoi en arrière-plan.

Cette approche améliore la réactivité de l'application et permet également de gérer des fonctionnalités comme les retries en cas d'échec ou le traitement de plusieurs tâches de manière organisée.

Même si mon projet reste personnel, je voulais apprendre à utiliser une solution proche de celles employées en entreprise pour les traitements asynchrones.
<a id="install"></a>

# ⚙️ Installation

## Cloner le projet

```bash
git clone https://github.com/QuentinLagree/Blog-monorepo.git

cd Blog-monorepo
```

---

## Installation

```bash
pnpm install
```

---

## Variables d'environnement

Créer les fichiers :

```
api/.env

web/.env
```

et renseigner les variables nécessaires.

---

## Lancer Docker

```bash
pnpm docker:dev
```

ou

```bash
docker compose -f docker-compose.dev.yml up
```

---

## Développement

Lancer le frontend

```bash
pnpm web:dev
```

Lancer le backend

```bash
pnpm api:dev
```

Ou lancer les deux

```bash
pnpm dev
```

---

<a id="script"></a>

# 📦 Scripts disponibles

## Général

```bash
pnpm install
```

Installe toutes les dépendances.

---

```bash
pnpm dev
```

Lance le frontend et le backend.

---

```bash
pnpm build
```

Compile tous les projets.

---

## Docker

```bash
pnpm docker:dev
```

Lance :

- MySQL
- Redis
- RedisInsight
- API
- Frontend

---

```bash
pnpm docker:prod
```

Lance l'environnement de production.

---

## Backend

```bash
pnpm api:dev
```

Mode développement.

---

```bash
pnpm api:build
```

Compile le backend.

---

```bash
pnpm api:start
```

Lance le backend compilé.

---

## Frontend

```bash
pnpm web:dev
```

Mode développement Angular.

---

```bash
pnpm web:build
```

Build Angular.

---

# 🧪 Tests

Le backend dispose de plusieurs scripts permettant de tester les différentes couches de l'application.

| Commande | Description |
| ---------- | ------------- |
| `pnpm api:test` | Lance les tests unitaires |
| `pnpm api:test:watch` | Lance les tests en mode watch |
| `pnpm api:test:cov` | Génère le rapport de couverture des tests |
| `pnpm api:test:e2e` | Lance les tests End-to-End |
| `pnpm api:test:debug` | Lance les tests en mode debug |

<a id="security"></a>

# 🔒 Sécurité

- Validation des DTO
- Guards NestJS
- Authentification
- Autorisation
- Vérification des permissions

---
<a id="difficulty"></a>

# 🧠 Difficultés rencontrées

Au cours du développement, plusieurs difficultés techniques m'ont amené à faire évoluer l'architecture du projet.

## Refactoring du formulaire d'article

Le composant de création d'article gérait initialement :

- le formulaire
- les brouillons
- l'éditeur Markdown
- les images
- la prévisualisation

Il dépassait plusieurs centaines de lignes et devenait difficile à maintenir.

J'ai progressivement appliqué les principes SOLID en extrayant plusieurs services spécialisés :

- PostDraftManager
- PostFormSubmitService
- MarkdownEditorService
- ImageEditorService

Le composant est désormais centré sur la gestion de l'interface tandis que chaque service possède une responsabilité claire.

### Gestion des erreurs

Au départ, les controllers géraient plusieurs responsabilités :

- Validation des données
- Gestion des erreurs
- Construction des réponses HTTP

Cette approche compliquait les tests unitaires, car chaque endpoint devait couvrir de nombreux cas d'usage.

J'ai donc centralisé la gestion des erreurs en créant un **Exception Filter** dédié aux erreurs Prisma. Les services lèvent désormais des exceptions métier explicites, comme `UserNotFoundException`, tandis que le filtre se charge de les convertir en réponses HTTP cohérentes.

Cette séparation des responsabilités rend le code plus lisible, plus maintenable et facilite les tests.
Les endpoints avait trop de responsabilité.

- la gestion des erreurs
- le renvoie de la réponse
- La validation des données de la requête

J'ai remarqué cette anomalie, lors des testes unitaires, trop de contrainte, trop de cas d'usage.

Pour remédier àa cette problématique. J'ai créé un filtres de toutes les erreurs possibles de prisma, et ensuite les renvoie d'erreur se font directement dans les service. Par exemple quand un utilisateur n'est pas trouvé en base de données : UserNotFoundException, et ceci permet d'avoir un message personnalisé en fonction des erreurs.

<a id="what_learn"></a>

# 📚 Ce que j'ai appris

Au travers de ce projet, j'ai approfondi plusieurs notions importantes :

- Architecture modulaire
- Refactoring avec les principes SOLID
- Injection de dépendances
- Gestion des traitements asynchrones avec BullMQ
- Docker
- API REST
- Prisma ORM
- Angular Signals
- Gestion d'état

---
<a id="roadmap"/>

## 🚧 Roadmap

## À venir

- [ ] Commentaires
- [x] Articles Lu ou en cours
- [x] Likes
- [x] Profils utilisateurs
- [ ] Notifications
- [ ] Upload cloud
- [x] Lecture d'article
- [x] Tests unitaires
- [ ] CI/CD

---

# 👨‍💻 Auteur

**Quentin Lagree**

Développeur Full Stack Junior

GitHub :
<https://github.com/QuentinLagree>

LinkedIn :
<https://www.linkedin.com/in/quentin-lagree>
