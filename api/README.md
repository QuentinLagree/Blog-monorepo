# 🧭 Blog Project – Progress Tracker

**Objectif :**  
120 jours pour terminer et déployer un blog complet (NestJS + Angular 20), sans le laisser rejoindre les repos GitHub oubliés.

---

## 📦 Stack technique

| Composant | Technologie | Statut |
|------------|--------------|--------|
| **Backend** | NestJS (Fastify) | ☐ |
| **Base de données** | Prisma + PostgreSQL | ☐ |
| **Authentification** | Sessions + Argon2id | ☐ |
| **Envoi d’emails** | Nodemailer + BullMQ | ☐ |
| **Frontend** | Angular 20 | ☐ |
| **Langage** | TypeScript | ☐ |
| **ORM** | Prisma | ☐ |
| **Queue / Cache** | Redis (BullMQ, caching) | ☐ |

---

## 📅 Roadmap & Suivi
---

### **M0 – Socle du projet**
> Mise en place des bases backend & frontend

- [x] NestJS (Fastify) configuré  
- [x] Prisma initialisé  
- [x] Authentification (sessions, cookies sécurisés)  
- [x] DTOs avec validation (class-validator)  
- [x] Base Angular 20 + routing  
- [ ] CORS + Helmet activés  
- [x] Variables d’environnement `.env` propres et centralisées  
- [X] Logger personnalisé (NestJS Custom)  

---

### **M1 – Gestion des articles (backend + admin)**

- [ ] Modèle `Article` (Prisma)  
- [ ] Endpoints CRUD `/articles`  
- [ ] Slug unique et publication `draft/published`  
- [ ] Sanitization Markdown (DOMPurify / marked)  
- [ ] Pagination et filtres (tags, date, auteur)  
- [ ] Test E2E création + publication article  

---

### **M2 – Éditeur Markdown (frontend)**

- [ ] Formulaire de rédaction d’article (simple)  
- [ ] Éditeur Markdown split-view (rédaction + preview)  
- [ ] Raccourcis Markdown (bold, italic, code, titres)  
- [ ] Auto-save (localStorage)  
- [ ] Upload image + insertion automatique dans le contenu  
- [ ] Sauvegarde article via API `/articles`  

---

### **M3 – Lecture publique**

- [ ] Page `/` : liste des articles  
- [ ] Page `/article/:slug` : affichage d’un article  
- [ ] Calcul du temps de lecture  
- [ ] Styles Markdown pour lecture agréable  
- [ ] Meta dynamique (title, description)  
- [ ] Navigation mobile fluide  

---

### **M4 – Préférences utilisateur**

- [ ] Modèle `Preference { theme, fontSize, readingMode, locale, ... }`  
- [ ] API `GET/PUT /users/:id/preferences`  
- [ ] Application front des préférences  
- [ ] Persistance locale (localStorage)  
- [ ] Hydratation au login  

---

### **M5 – Emailing & Notifications**

- [ ] Installer et configurer BullMQ (Redis)  
- [ ] Créer `MailService` et `MailProcessor`  
- [ ] Envoyer un mail de bienvenue / publication  
- [ ] Gérer les erreurs d’envoi (retry, backoff)  
- [ ] Ajouter provider (Postmark / Resend)  
- [ ] Ajouter DKIM/SPF/DMARC en prod  

---

### **M6 – Sécurité et Authentification avancée**

- [x] Bcrypt en place  
- [x] Migration vers **Argon2id**  
- [ ] Rehash automatique au login si ancien hash  
- [ ] Rate-limit sur `/auth/login`  
- [ ] Captcha ou double validation (si besoin)  
- [x] Rotation de session au login / logout  

---

### **M7 – Optimisation Prisma & Base de données**

- [ ] Indices (`User.email`, `Article.slug`, `publishedAt`)  
- [ ] Transactions atomiques  
- [ ] Pooling (pgBouncer / Neon / RDS Proxy)  
- [ ] Soft-delete (`deletedAt`)  
- [x] Seed automatique (users + articles tests)  

---

### **M8 – Caching & Performance**

- [ ] Redis cache pour `/articles` (TTL 120s)  
- [ ] Purge cache à la publication  
- [ ] Lazy loading Angular + code splitting  
- [ ] Compression Gzip / Brotli (Fastify plugin)  

---

### **M9 – Observabilité & Monitoring**

- [x] Logs structurés  
- [ ] Health checks `/health`  
- [ ] Metrics basiques (Fastify metrics / Prometheus)  
- [ ] Traces OpenTelemetry (optionnel)  
- [ ] Alertes mail / Slack sur erreur critique  

---

### **M10 – Tests, CI/CD et Qualité**

- [x] Tests unitaires (Nest + Jest)  
- [ ] Tests E2E (auth + CRUD article)  
- [x] Lint et format (ESLint + Prettier)  
- [ ] CI GitHub Actions : lint + test + build  
- [ ] Déploiement auto (Vercel / Render / Docker)  

---

### **M11 – SEO & Production**

- [ ] Sitemap.xml & robots.txt  
- [ ] RSS feed (optionnel)  
- [ ] Canonical URLs  
- [ ] OG/Twitter meta tags  
- [ ] Vérification Lighthouse  

---

### **M12 – Lancement officiel**

- [ ] Page “À propos”  
- [ ] Publication d’au moins **2 articles réels**  
- [ ] Vérification des performances et analytics  
- [ ] Mise en production finale 🎉  

---

## 🧠 Notes & Idées futures

- [ ] Historique de révisions d’article  
- [ ] Multi-utilisateurs / rôles (éditeur, admin)  
- [ ] Commentaires sur article  
- [ ] Thèmes personnalisés  
- [ ] PWA / offline mode  
- [ ] Intégration newsletter  

---

## 🧰 Scripts utiles

| Commande | Description |
|-----------|-------------|
| `pnpm run start:dev` | Démarrage backend en développement |
| `npx prisma studio` | Interface DB |
| `pnpm run test` | Tests unitaires |
| `pnpm run lint` | Vérification du code |

---

## 🧰 Scripts utiles PRISMA

| Commande | Description |
|-----------|-------------|
| `pnpm run start:prod` | Lancement backend buildé |
| `pnpm run prisma:build` | Merger tous les fichiers .prisma en un seul pour la migration |
| `pnpm run prisma:validate` | Vérifie si les models sont bien conforme et valide avant migration |
| `pnpm run prisma:generate` | Génère un nouveau client Prisma afin d'avoir les modification des schema en codebase |
| `pnpm run prisma:migrate` | Effectue la migration des models Prisma |
| `pnpm run prisma:deploy` | Deploie les migrations sur la Base de donnée courante (actuellement Localhost MySQL) |
| `pnpm run prisma:studio` | Permet la visualisation de la base donnée dans l'éditeur Prisma Studio |
| `pnpm run prisma:seed` | Permet la création d'utilisateur et articles de testes, afin d'avoir des data dans la base de donnée au démarage |

---

## 📊 Statut général du projet

| Domaine | Progression |
|----------|--------------|
| **Backend (NestJS)** | ☐ |
| **Frontend (Angular)** | ☐ |
| **DB & Prisma** | ☐ |
| **Sécurité & Auth** | ☐ |
| **Emailing & Queue** | ☐ |
| **UX / UI** | ☐ |
| **CI/CD & tests** | ☐ |

---

## 🧭 TL;DR (priorités immédiates)

1. [x] Passer **bcrypt → Argon2id**  
2. [ ] Mettre en place **BullMQ + Nodemailer provider**  
3. [ ] Intégrer **éditeur Markdown complet** (split-view + preview)  
4. [ ] Ajouter **cache Redis** sur les routes publiques  
5. [ ] Finaliser **workflow de publication** côté admin  
6. [ ] Mettre en place **tests E2E + CI/CD**  

---

## 💬 Auteur

Projet développé par **Lagree Quentin**

> Défi: “120 jours pour terminer un projet, et ne pas le laisser partir dans le cimetière de mes répos github...”
