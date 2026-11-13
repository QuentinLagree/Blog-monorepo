# Checklist des essentiels avant de préparer la production

Cette liste couvre le développement nécessaire pour obtenir une application complète, cohérente, sécurisée et testée en local. La préparation de l’hébergement et du déploiement viendra ensuite.

Ordre conseillé : corriger les problèmes bloquants → fiabiliser les parcours existants → ajouter les commentaires → valider l’ensemble.

- **P0** : corrections et protections prioritaires.
- **P1** : fonctionnalités et comportements indispensables à la version retenue.
- **P2** : validation finale et qualité de l’application.

Une case vide indique une tâche à réaliser ou à vérifier, pas forcément un bug ou une fonctionnalité absente. Les observations initiales datent du 13 novembre 2026 et doivent être revérifiées après modification. Aucun test n’a été exécuté pour établir cette liste.

## P0 — Corriger et consolider les fondations

- [ ] Vérifier le rendu Markdown dans `web/src/main.ts` : lors de la première lecture, la sanitisation était désactivée avec `SecurityContext.NONE`.
- [ ] Sécuriser le rendu des articles et de leur aperçu tout en conservant les fonctionnalités Markdown nécessaires.
- [ ] Tester les contenus malveillants : HTML, gestionnaires d’événements, liens `javascript:`, images et SVG.
- [ ] Vérifier la cohérence entre fragments Prisma, schéma fusionné et client généré, notamment pour la relation `postReads` utilisée par les articles.
- [ ] Vérifier que les migrations reconstruisent correctement une base de développement vide et préservent les données existantes lors d’une évolution.
- [ ] Corriger les erreurs de typage, de compilation et de lint du backend et du frontend.
- [ ] Vérifier les contrats API/frontend : routes, DTO, champs, types, dates, pagination et format des erreurs.
- [ ] Vérifier la distinction entre champs absents, valeurs nulles et valeurs vides lors des mises à jour.
- [ ] Centraliser la configuration de l’URL de l’API et vérifier que chaque compilation Angular fournit les propriétés utilisées, notamment `apiUrl`.
- [ ] Harmoniser les versions de Node et pnpm nécessaires au développement et aux vérifications.
- [ ] Clarifier les lockfiles et la procédure d’installation du monorepo.
- [ ] Vérifier qu’un clone propre peut être installé et démarré avec les instructions du README.
- [ ] Fournir des exemples de variables d’environnement sans secret et documenter les services locaux requis.
- [ ] Isoler les données et services de test ; empêcher les scripts de nettoyage de cibler une autre base.

## P0 — Sécuriser les accès et les données

- [ ] Vérifier les droits de chaque route : visiteur, utilisateur connecté, propriétaire et administrateur.
- [ ] Vérifier que les contrôles d’accès sont appliqués côté API indépendamment des guards Angular.
- [ ] Empêcher un utilisateur de choisir son rôle ou l’identité du propriétaire d’une ressource.
- [ ] Vérifier l’isolation des brouillons sur les listes, profils, accès par identifiant et accès par slug.
- [ ] Vérifier que les réponses publiques ne révèlent ni mot de passe haché, ni jeton, ni donnée de session, ni email privé.
- [ ] Vérifier les champs modifiables des DTO et refuser les changements sensibles non autorisés.
- [ ] Vérifier identifiants, longueurs, formats, bornes numériques et pagination côté API.
- [ ] Définir et tester la protection CSRF des opérations authentifiées par cookie en complément de `SameSite`. [Référence OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html).
- [ ] Vérifier la politique CORS et les requêtes provenant d’origines non autorisées.
- [ ] Vérifier l’envoi des cookies entre Angular et l’API en développement.
- [ ] Tester l’expiration des sessions et leur suppression à la déconnexion.
- [ ] Tester l’invalidation des sessions après changement de mot de passe ou suppression du compte.
- [ ] Vérifier la prise en compte des changements de rôle sur les sessions existantes.
- [ ] Vérifier que le cache navigateur de la session ne décide jamais des autorisations.
- [ ] Vérifier le hachage et la validation des mots de passe à l’inscription et à la réinitialisation.
- [ ] Vérifier les limites de tentatives sur connexion, inscription et récupération de mot de passe.
- [ ] Ajouter ou vérifier les limites adaptées aux articles, commentaires, likes et emails.
- [ ] Vérifier les limites de taille des requêtes et des contenus.
- [ ] Vérifier que les erreurs ne divulguent ni secret, ni requête SQL, ni détail interne inutile.
- [ ] Vérifier l’absence de secrets dans les fichiers suivis et les logs ; remplacer tout secret exposé.
- [ ] Valider les variables indispensables au démarrage avec des erreurs compréhensibles.
- [ ] Auditer les dépendances installées et traiter les vulnérabilités exploitables.

## P1 — Finaliser les fonctionnalités existantes

- [ ] Vérifier le parcours inscription → connexion → profil → déconnexion.
- [ ] Décider si la vérification d’email est nécessaire avant de publier ou commenter, puis terminer le parcours correspondant.
- [ ] Vérifier le cycle d’un article : création, brouillon, modification, publication et suppression.
- [ ] Vérifier le comportement du bouton « publier » lors de l’édition d’un article existant.
- [ ] Vérifier la stabilité des liens après changement de titre et les collisions de slugs.
- [ ] Vérifier les likes, leurs compteurs et les actions répétées.
- [ ] Vérifier la progression de lecture et le filtrage des articles déjà lus.
- [ ] Vérifier la pagination des listes publiques et personnelles.
- [ ] Vérifier les modifications de profil et les conflits d’email ou de pseudo.
- [ ] Vérifier les conséquences d’une suppression de compte sur toutes les données associées.
- [ ] Vérifier que les préférences de confidentialité sont réellement appliquées par l’API.
- [ ] Faire correspondre les réglages affichés aux fonctionnalités disponibles : notifications, newsletter et contributions.
- [ ] Masquer les options sans effet jusqu’à leur implémentation.
- [ ] Retirer ou restreindre la page de démonstration `/ui` si elle n’a pas de rôle public.

## P1 — Régler le stockage des images

Le code consulté crée des références `localimg:` et des URL de navigateur : vérifier leur devenir après publication.

- [ ] Vérifier qu’une image publiée s’affiche depuis un autre navigateur et un autre appareil.
- [ ] Choisir entre un stockage durable avec upload et une première version limitée aux URL externes.
- [ ] Empêcher la publication de références locales inutilisables par les lecteurs.
- [ ] Si upload : contrôler l’autorisation, la taille, le type réel et les noms générés côté serveur. [Référence OWASP](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html).
- [ ] Si upload : définir les formats autorisés et le traitement des SVG.
- [ ] Prévoir la suppression des médias devenus inutilisés.
- [ ] Prévoir les textes alternatifs et le comportement en cas d’image indisponible.

## P1 — Ajouter une première version complète des commentaires

Périmètre conseillé pour la première version : commentaires simples, sans pièces jointes ni réponses imbriquées.

### Règles métier

- [ ] Définir qui peut commenter : utilisateurs connectés, éventuellement avec email vérifié.
- [ ] Définir qui peut lire les commentaires et sur quels articles.
- [ ] Définir les règles de modification et de suppression par leur auteur.
- [ ] Définir les pouvoirs des administrateurs et, si souhaité, de l’auteur de l’article.
- [ ] Choisir entre publication immédiate et validation avant publication.
- [ ] Choisir le format : texte brut ou sous-ensemble Markdown sécurisé.
- [ ] Fixer la longueur minimale et maximale ; refuser les commentaires vides après nettoyage des espaces.
- [ ] Définir les conséquences de la suppression d’un article ou d’un compte sur les commentaires.
- [ ] Définir les conséquences du retour d’un article en brouillon.
- [ ] Définir une politique de suppression définitive ou de conservation limitée des contenus modérés.

### Base de données et API

- [ ] Concevoir le modèle Prisma : auteur, article, contenu, dates et état de modération.
- [ ] Ajouter les relations et index correspondant aux lectures prévues.
- [ ] Créer la migration et vérifier la conservation des données existantes.
- [ ] Prévoir une pagination bornée avec un ordre déterministe.
- [ ] Définir les DTO d’entrée et de sortie.
- [ ] Déduire l’auteur de la session côté serveur.
- [ ] Ajouter la création d’un commentaire.
- [ ] Ajouter la consultation paginée des commentaires visibles.
- [ ] Ajouter la modification par l’auteur.
- [ ] Ajouter la suppression par l’auteur.
- [ ] Ajouter les actions de modération.
- [ ] Empêcher les commentaires sur les articles inexistants ou non accessibles.
- [ ] Empêcher la modification du commentaire d’un autre utilisateur.
- [ ] Ne pas exposer au public les commentaires masqués ni les informations internes de modération.
- [ ] Ajouter une limitation de fréquence par compte et par IP.
- [ ] Définir un comportement contre les soumissions répétées et le spam.
- [ ] Documenter les routes et les erreurs attendues.

### Interface Angular

- [ ] Afficher les commentaires sous l’article.
- [ ] Ajouter le formulaire et sa validation.
- [ ] Afficher une invitation à se connecter pour les visiteurs.
- [ ] Ajouter les états chargement, liste vide, erreur et nouvelle tentative.
- [ ] Désactiver la soumission pendant l’envoi.
- [ ] Conserver le texte saisi lorsqu’un envoi échoue.
- [ ] Afficher l’auteur, la date et l’indication de modification.
- [ ] Ajouter les actions de modification et de suppression avec confirmation adaptée.
- [ ] Gérer l’expiration de session pendant la rédaction.
- [ ] Mettre à jour la liste et le compteur après chaque action.
- [ ] Rendre le formulaire et les actions accessibles au clavier et aux lecteurs d’écran.

### Modération

- [ ] Prévoir un moyen de signaler un commentaire.
- [ ] Prévoir une interface minimale permettant de consulter et traiter les signalements.
- [ ] Permettre de masquer rapidement un contenu abusif.
- [ ] Définir un moyen de suspendre un compte abusif et vérifier l’effet sur ses sessions.
- [ ] Journaliser les actions de modération sans recopier inutilement les données personnelles.
- [ ] Publier les règles de participation.

## P1 — Tester les commentaires

- [ ] Identifier les comportements métier à couvrir avant d’écrire les sous-tests.
- [ ] Tester la création valide et les contenus invalides.
- [ ] Tester les visiteurs et sessions expirées.
- [ ] Tester les droits de modification, suppression et modération.
- [ ] Tester les articles inexistants, brouillons et supprimés.
- [ ] Tester la pagination et l’ordre lorsque plusieurs commentaires ont la même date.
- [ ] Tester la visibilité des commentaires masqués.
- [ ] Tester les limites de fréquence et le comportement lorsque Redis est indisponible.
- [ ] Tester les tentatives d’injection dans le contenu et les liens.
- [ ] Tester les relations et suppressions avec une vraie base isolée.
- [ ] Tester le parcours complet dans le navigateur : publier, consulter, modifier et supprimer.
- [ ] Vérifier les réactions aux doubles clics, erreurs réseau et réponses tardives.

## P1 — Fiabiliser les emails et la récupération du compte

- [ ] Tester les emails avec un serveur de capture local ou une boîte de test dédiée.
- [ ] Vérifier destinataires, sujets et contenus des emails d’accueil et de récupération.
- [ ] Vérifier que les liens sont construits depuis la configuration de l’application.
- [ ] Tester l’expiration et l’usage unique des jetons de récupération.
- [ ] Tester les comptes inexistants, demandes répétées et jetons invalides.
- [ ] Vérifier l’absence de divulgation inutile de l’existence d’un compte.
- [ ] Vérifier le rendu des emails et l’échappement des valeurs provenant des utilisateurs.
- [ ] Tester les tentatives automatiques BullMQ et les échecs définitifs d’envoi.
- [ ] Vérifier que les erreurs SMTP ne laissent pas le parcours dans un état incohérent.
- [ ] Définir la rétention des tâches sans conserver inutilement les jetons sensibles.

## P2 — Terminer les interfaces essentielles

- [ ] Ajouter une page 404 et des messages adaptés aux ressources introuvables.
- [ ] Vérifier les états de chargement, listes vides, succès et erreurs sur chaque parcours.
- [ ] Gérer les doubles clics et les soumissions répétées sur les actions sensibles.
- [ ] Conserver les saisies utiles lorsqu’une requête échoue.
- [ ] Prévenir la perte accidentelle d’un article en cours de rédaction.
- [ ] Vérifier l’isolation des brouillons locaux entre utilisateurs d’un même navigateur et leur traitement à la déconnexion ou à la suppression du compte.
- [ ] Vérifier l’ergonomie sur petit écran et avec des textes longs.
- [ ] Vérifier les labels, messages de validation, contrastes, focus et navigation au clavier.
- [ ] Vérifier les thèmes et la réduction des animations.
- [ ] Vérifier les liens internes, retours arrière et accès directs aux pages.
- [ ] Vérifier les formulaires avec accents, espaces, caractères spéciaux et valeurs limites.
- [ ] Vérifier la cohérence des textes, dates et messages en français.
- [ ] Retirer les textes provisoires des écrans destinés aux utilisateurs.
- [ ] Ajouter des titres de page pertinents pour les écrans principaux et les articles.
- [ ] Vérifier les lenteurs perceptibles et les chargements inutiles.

## P2 — Valider l’application complète

- [ ] Identifier les comportements métier essentiels et les tests existants qui les couvrent.
- [ ] Compléter les tests unitaires utiles sans multiplier les tests redondants.
- [ ] Vérifier les mocks, la qualité des assertions et les faux positifs possibles.
- [ ] Vérifier que les tests de contrôleurs couvrent leurs responsabilités sans prétendre vérifier les guards ou la validation HTTP lorsqu’ils appellent directement une méthode.
- [ ] Compléter les tests d’intégration et HTTP avec MySQL et Redis isolés.
- [ ] Tester les parcours navigateur : compte, récupération, brouillon, publication, lecture et commentaires.
- [ ] Tester les autorisations avec plusieurs comptes et plusieurs rôles.
- [ ] Tester les erreurs réseau, sessions expirées et ressources supprimées pendant une action.
- [ ] Tester les comportements lorsque MySQL, Redis ou SMTP est indisponible.
- [ ] Tester les appels concurrents sur les actions concernées : likes, publication et commentaires.
- [ ] Vérifier que compteurs et listes restent cohérents après ajout, modification ou suppression.
- [ ] Vérifier les principaux navigateurs et au moins un navigateur mobile.
- [ ] Exécuter les tests API et frontend retenus et analyser les échecs.
- [ ] Exécuter le typage, le lint sans correction et les vérifications de formatage.
- [ ] Vérifier que les compilations optimisées de l’API et d’Angular réussissent.
- [ ] Documenter les commandes de vérification et les limites connues.

## Critères pour commencer ensuite la préparation de la production

- [ ] Le périmètre essentiel de la première version est défini et réalisé.
- [ ] Aucun problème bloquant connu ne subsiste sur les parcours essentiels.
- [ ] Les droits d’accès, sessions, contenus et données sensibles ont été vérifiés.
- [ ] Les commentaires sont utilisables, sécurisés et modérables.
- [ ] Les images publiées sont lisibles par les autres utilisateurs selon la solution retenue.
- [ ] Les options visibles correspondent à des comportements réellement disponibles.
- [ ] Les tests nécessaires, le typage et les compilations passent effectivement.
- [ ] Un autre développeur peut installer, lancer et vérifier le projet depuis sa documentation.

L’hébergement, les domaines, les certificats, le reverse proxy, les images Docker de production, la CI/CD, les sauvegardes, la supervision et le lancement public feront l’objet d’une checklist ultérieure. Les réponses imbriquées, mentions, réactions, recherche, tags, RSS et newsletter restent facultatifs pour cette première version.
