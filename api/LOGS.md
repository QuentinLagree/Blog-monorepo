# Gestion des logs

## Archivage automatique

Le logger écrit dans `LOG_DIR`, ou dans `api/logs_files` lorsque l’API est lancée depuis `api`. Les noms journaliers utilisent la date UTC : `app-YYYY-MM-DD.log`.

Une vérification s’exécute au démarrage de l’API puis toutes les heures, sans bloquer son démarrage. Un mois devient éligible **30 jours complets après la fin du mois**, en UTC. Par exemple, septembre 2026 devient éligible le 31 octobre 2026 à 00:00 UTC. Les fichiers modifiés depuis moins de 30 jours sont conservés et seront ajoutés ultérieurement à l’archive.

Les fichiers sont regroupés dans `logs_files/archives/app-YYYY-MM.tar.gz`. Avant de retirer les sources, le gestionnaire relit l’archive et compare le SHA-256 de chaque fichier. L’archive temporaire est synchronisée sur disque puis renommée. Une erreur de compression ou de vérification conserve les sources. Les archives existantes sont conservées et complétées lorsqu’un ancien fichier supplémentaire apparaît. Un même nom avec un contenu différent provoque un conflit, sans écrasement silencieux.

La vérification automatique est désactivée pendant les tests. Pour la désactiver ailleurs, définir `LOG_ARCHIVE_ENABLED=false`. Aucun âge ne déclenche la suppression automatique des archives.

Les commandes gèrent les fichiers `app-YYYY-MM-DD.log`, leurs archives et, pour consultation, le fichier non journalier `app.log`. Un préfixe de transport personnalisé n’est pas pris en charge par ce gestionnaire.

## Commandes depuis la racine du dépôt

Le raccourci racine `pnpm logs list` fonctionne également, de même que `pnpm logs search --level Fatal`, `pnpm logs archive --dry-run` ou `pnpm logs --help`.

```powershell
pnpm --dir api logs --help
pnpm --dir api logs:list
pnpm --dir api logs:check
pnpm --dir api logs:archive --dry-run
pnpm --dir api logs:archive
```

Le mode `--dry-run` montre les groupes concernés sans compresser ni supprimer les sources. `logs:check` lit les fichiers et vérifie que les archives peuvent être décodées et que leurs entrées sont valides ; il renvoie un code de sortie non nul en cas d’échec. Il ne constitue pas une preuve d’authenticité des logs.

`show` affiche directement le texte des logs, sans enveloppe JSON. Les autres commandes produisent du JSON pour pouvoir être exploitées par d’autres scripts. Toutes les commandes acceptent `--dir CHEMIN` pour travailler sur un autre dossier. `LOG_DIR` est également chargé depuis `api/.env` par les scripts de développement.

Pour une sortie JSON sans les bannières de pnpm, exécuter directement `node dist/commons/logger/logs.cli.js list` depuis `api`, après compilation.

### Consulter et rechercher

```powershell
pnpm --dir api logs:show app-2026-09-01.log --tail 50
pnpm --dir api logs:show app-2026-09.tar.gz --tail 100
pnpm --dir api logs:search --query "connexion"
pnpm --dir api logs:search --level Fatal --from 2026-09-01 --to 2026-09-30
pnpm --dir api logs:search --query "redis" --file app-2026-09-01.log --limit 200
```

La consultation d’un fichier journalier fonctionne aussi après son archivage. Les résultats comportent le fichier original, le numéro de ligne et le texte. Les filtres de dates portent sur le nom journalier UTC. La recherche est textuelle, insensible à la casse, sans expression régulière. Les niveaux disponibles sont `Info`, `Warning`, `Success`, `Debug` et `Fatal`.

La recherche retourne au maximum 100 résultats par défaut, jusqu’à 10000 avec `--limit`. `--tail` est également borné à 10000 lignes. La lecture est effectuée en flux ; les archives restent compressées sur disque.

### Épingler une erreur ou un fichier

```powershell
pnpm --dir api logs:pin app-2026-09-01.log --line 12 --note "Erreur Redis à examiner"
pnpm --dir api logs:pin app-2026-09.tar.gz --note "Incident de septembre"
pnpm --dir api logs:pins
pnpm --dir api logs:unpin IDENTIFIANT_RETOURNE
```

Une épingle contient un identifiant, un nom de fichier, une note, une date et éventuellement une ligne. Le numéro de ligne est vérifié lors de sa création. L’index est conservé dans `.pins.json`, dans le dossier de logs.

Épingler un fichier n’empêche pas sa compression : le nom original et la ligne restent consultables dans l’archive. L’épingle bloque la suppression du fichier et de l’archive mensuelle qui le contient. Il faut retirer toutes les épingles concernées avant de supprimer une archive. Les fichiers peuvent toujours être modifiés hors de ces commandes : l’épingle n’est pas une protection du système de fichiers ni une copie immuable de l’erreur.

### Télécharger ou exporter

```powershell
pnpm --dir api logs:download app-2026-09.tar.gz --out ../exports/septembre.tar.gz
pnpm --dir api logs:export app-2026-09-01.log --out ../exports/incident.log
```

Les chemins relatifs de destination sont interprétés depuis `api`. L’export crée une copie locale : aucune API HTTP publique de téléchargement n’est ajoutée. Un fichier journalier peut être exporté seul depuis son archive. La destination doit être extérieure au dossier des logs et ne doit pas déjà exister.

Avec Docker, les logs de développement sont accessibles dans `api/logs_files` grâce au montage du projet. Pour une autre installation :

```powershell
docker compose -f docker-compose.dev.yml exec -T api pnpm logs:list
docker compose -f docker-compose.dev.yml exec -T api pnpm logs:download app-2026-09.tar.gz --out /tmp/septembre.tar.gz
docker cp blog-api:/tmp/septembre.tar.gz ./septembre.tar.gz
```

Ne pas oublier de monter un stockage persistant pour `LOG_DIR` dans un déploiement utilisant un système de fichiers de conteneur éphémère. Conserver `.pins.json` avec les logs.

### Supprimer

```powershell
pnpm --dir api logs:delete app-2026-09-01.log --yes
pnpm --dir api logs:delete app-2026-09.tar.gz --yes
```

La suppression exige un nom exact et `--yes`. Les chemins arbitraires, fichiers du jour ou futurs, fichier actif non journalier `app.log`, liens symboliques et éléments épinglés sont refusés. La suppression porte sur un fichier journalier encore présent ou une archive complète ; elle ne réécrit pas une archive pour en supprimer une seule entrée.

## Exécution après compilation

```powershell
pnpm --dir api build
pnpm --dir api logs:prod list
pnpm --dir api logs:prod search --level Fatal
```

La variante `logs:prod` utilise le JavaScript compilé et ne dépend ni de `tsx` ni de `dotenv-cli`. Elle utilise les variables d’environnement du processus : fournir `LOG_DIR` si nécessaire.

## Concurrence et incidents

Les opérations de gestion partagent un verrou avec heartbeat (`.maintenance.lock`). Si une autre commande ou l’archivage automatique est en cours, la commande échoue avec un code non nul : réessayer après sa fin. Un verrou abandonné est récupérable automatiquement après deux minutes sans heartbeat. Les fichiers du jour continuent d’être écrits pendant l’archivage des anciens mois.

En cas d’archive corrompue ou de conflit de contenu, conserver les fichiers et examiner `logs:check`. Ne pas supprimer les sources pour contourner l’erreur. Une copie interrompue peut laisser un export incomplet ; vérifier son contenu avant de l’utiliser.
