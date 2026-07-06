# Blog-monorepo

> Plateforme de blog Full Stack développée avec **Angular** et **NestJS**.

Ce projet a pour objectif de reproduire une application de blog moderne tout en mettant en pratique des concepts avancés de développement Full Stack tels que :

- Architecture modulaire
- Principes SOLID
- Authentification
- API REST
- Gestion des rôles
- Redis & BullMQ
- Docker
- Prisma ORM
- Éditeur Markdown
- Gestion des brouillons

---

# 📸 Aperçu

> *(Ajouter ici des captures d'écran de l'application)*

- Accueil
- Connexion
- Création d'article
- Éditeur Markdown
- Administration

---

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
- Recherche

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
- Postman
- Figma

---

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

# 🔒 Sécurité

- Validation des DTO
- Guards NestJS
- Authentification
- Autorisation
- Vérification des permissions

---

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

# 🚧 Roadmap

## À venir

- [ ] Commentaires
- [ ] Likes
- [ ] Profils utilisateurs
- [ ] Notifications
- [ ] Upload cloud
- [ ] Tests unitaires
- [ ] CI/CD

---

# 👨‍💻 Auteur

**Quentin Lagree**

Développeur Full Stack Junior

GitHub :
https://github.com/QuentinLagree

LinkedIn :
https://www.linkedin.com/in/quentin-lagree
