export type PostSeedData = {
  title: string;
  description: string;
  content: string;
  published_at: Date | null;
};

export const postsSeedData: PostSeedData[] = [
  {
  title: 'Guide complet pour bien débuter avec Angular Signals',
  description:
    'Découvrez en détail le fonctionnement des Signals Angular, les valeurs calculées, les effets, les bonnes pratiques et leur utilisation dans une application réelle.',
  content: `
# Guide complet pour bien débuter avec Angular Signals

Angular Signals est un système de réactivité introduit dans Angular afin de simplifier la gestion des états et des dépendances entre les données.

Un Signal contient une valeur. Lorsque cette valeur change, Angular peut automatiquement mettre à jour les parties de l'application qui en dépendent.

Les Signals peuvent être utilisés dans plusieurs situations :

- gérer l'état local d'un composant ;
- partager des données dans un service ;
- calculer une valeur à partir d'autres Signals ;
- déclencher un traitement lors d'un changement ;
- améliorer la lisibilité du code ;
- limiter certaines manipulations manuelles avec RxJS.

Les Signals ne remplacent pas systématiquement RxJS. Les deux outils répondent à des besoins différents et peuvent être utilisés ensemble.

---

## 1. Créer un premier Signal

La fonction \`signal\` permet de créer une valeur réactive.

\`\`\`ts
import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-counter',
  templateUrl: './counter.component.html',
})
export class CounterComponent {
  counter = signal(0);
}
\`\`\`

Dans cet exemple, le Signal \`counter\` contient initialement la valeur \`0\`.

Pour lire sa valeur dans le fichier TypeScript, il faut appeler le Signal comme une fonction.

\`\`\`ts
console.log(this.counter());
\`\`\`

Dans le template Angular, la syntaxe est identique.

\`\`\`html
<p>Valeur actuelle : {{ counter() }}</p>
\`\`\`

Angular détecte que le template dépend du Signal \`counter\`. Lorsque sa valeur change, le texte est automatiquement mis à jour.

---

## 2. Modifier la valeur avec set

La méthode \`set\` remplace directement la valeur actuelle.

\`\`\`ts
this.counter.set(10);
\`\`\`

Voici un composant complet :

\`\`\`ts
import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-counter',
  template: \`
    <p>Compteur : {{ counter() }}</p>

    <button type="button" (click)="reset()">
      Réinitialiser
    </button>
  \`,
})
export class CounterComponent {
  counter = signal(5);

  reset(): void {
    this.counter.set(0);
  }
}
\`\`\`

La méthode \`set\` est adaptée lorsque la nouvelle valeur ne dépend pas de la valeur précédente.

---

## 3. Modifier la valeur avec update

La méthode \`update\` permet de calculer la nouvelle valeur à partir de la valeur actuelle.

\`\`\`ts
this.counter.update((currentValue) => currentValue + 1);
\`\`\`

Exemple avec deux boutons :

\`\`\`ts
increment(): void {
  this.counter.update((value) => value + 1);
}

decrement(): void {
  this.counter.update((value) => value - 1);
}
\`\`\`

Le template peut ensuite appeler ces méthodes.

\`\`\`html
<section>
  <h2>Compteur</h2>

  <p>{{ counter() }}</p>

  <button type="button" (click)="decrement()">
    Diminuer
  </button>

  <button type="button" (click)="increment()">
    Augmenter
  </button>
</section>
\`\`\`

Utilisez généralement :

- \`set\` pour remplacer directement une valeur ;
- \`update\` lorsque la nouvelle valeur dépend de l'ancienne.

---

## 4. Typer correctement un Signal

TypeScript peut souvent déduire automatiquement le type du Signal.

\`\`\`ts
username = signal('Quentin');
age = signal(25);
isConnected = signal(false);
\`\`\`

Il est aussi possible de préciser explicitement le type.

\`\`\`ts
selectedPostId = signal<number | null>(null);
\`\`\`

Pour les objets, une interface améliore la lisibilité.

\`\`\`ts
type User = {
  id: number;
  pseudo: string;
  role: 'admin' | 'user';
};

currentUser = signal<User | null>(null);
\`\`\`

La valeur peut ensuite être modifiée avec \`set\`.

\`\`\`ts
this.currentUser.set({
  id: 1,
  pseudo: 'QuentinLa',
  role: 'admin',
});
\`\`\`

---

## 5. Travailler avec des tableaux

Un Signal peut contenir un tableau.

\`\`\`ts
type Post = {
  id: number;
  title: string;
};

posts = signal<Post[]>([]);
\`\`\`

Pour ajouter un élément, il est recommandé de créer un nouveau tableau.

\`\`\`ts
addPost(post: Post): void {
  this.posts.update((currentPosts) => [
    ...currentPosts,
    post,
  ]);
}
\`\`\`

Pour supprimer un élément :

\`\`\`ts
removePost(postId: number): void {
  this.posts.update((currentPosts) =>
    currentPosts.filter((post) => post.id !== postId),
  );
}
\`\`\`

Pour modifier un élément :

\`\`\`ts
renamePost(postId: number, title: string): void {
  this.posts.update((currentPosts) =>
    currentPosts.map((post) =>
      post.id === postId
        ? {
            ...post,
            title,
          }
        : post,
    ),
  );
}
\`\`\`

Cette approche évite de modifier directement le tableau existant.

---

## 6. Éviter les mutations directes

Il faut éviter de modifier directement un objet ou un tableau contenu dans un Signal.

Exemple à éviter :

\`\`\`ts
this.posts().push(newPost);
\`\`\`

Dans ce cas, le tableau est modifié, mais le Signal ne reçoit pas nécessairement une nouvelle référence.

Préférez :

\`\`\`ts
this.posts.update((posts) => [...posts, newPost]);
\`\`\`

Même principe pour un objet.

Exemple à éviter :

\`\`\`ts
this.currentUser()!.pseudo = 'NouveauPseudo';
\`\`\`

Préférez :

\`\`\`ts
this.currentUser.update((user) => {
  if (!user) {
    return null;
  }

  return {
    ...user,
    pseudo: 'NouveauPseudo',
  };
});
\`\`\`

Créer une nouvelle référence rend les changements plus prévisibles.

---

## 7. Créer une valeur calculée avec computed

La fonction \`computed\` permet de créer une valeur dérivée d'un ou plusieurs Signals.

\`\`\`ts
import { computed, signal } from '@angular/core';

firstname = signal('Quentin');
lastname = signal('Lagree');

fullname = computed(
  () => \`\${this.firstname()} \${this.lastname()}\`,
);
\`\`\`

Le template peut afficher directement la valeur calculée.

\`\`\`html
<p>Nom complet : {{ fullname() }}</p>
\`\`\`

Si \`firstname\` ou \`lastname\` change, \`fullname\` est automatiquement recalculé.

\`\`\`ts
this.firstname.set('Jean');
\`\`\`

Le nom complet devient automatiquement \`Jean Lagree\`.

---

## 8. Filtrer une liste avec computed

Une valeur calculée est particulièrement utile pour filtrer une liste.

\`\`\`ts
type Post = {
  id: number;
  title: string;
  published_at: Date | null;
};

posts = signal<Post[]>([]);
search = signal('');

filteredPosts = computed(() => {
  const normalizedSearch = this.search()
    .trim()
    .toLowerCase();

  if (!normalizedSearch) {
    return this.posts();
  }

  return this.posts().filter((post) =>
    post.title.toLowerCase().includes(normalizedSearch),
  );
});
\`\`\`

Le champ de recherche peut modifier le Signal.

\`\`\`html
<input
  type="search"
  [value]="search()"
  (input)="search.set($any($event.target).value)"
  placeholder="Rechercher un article"
/>

@for (post of filteredPosts(); track post.id) {
  <article>
    <h2>{{ post.title }}</h2>
  </article>
}
\`\`\`

Le filtrage est automatiquement recalculé lorsque :

- la recherche change ;
- la liste des posts change.

---

## 9. Calculer le nombre de posts publiés

Plusieurs valeurs calculées peuvent dépendre du même Signal.

\`\`\`ts
publishedPosts = computed(() =>
  this.posts().filter((post) => post.published_at !== null),
);

draftPosts = computed(() =>
  this.posts().filter((post) => post.published_at === null),
);

publishedCount = computed(
  () => this.publishedPosts().length,
);

draftCount = computed(
  () => this.draftPosts().length,
);
\`\`\`

Dans le template :

\`\`\`html
<p>Articles publiés : {{ publishedCount() }}</p>
<p>Brouillons : {{ draftCount() }}</p>
\`\`\`

L'intérêt est d'éviter de recalculer manuellement ces valeurs après chaque modification.

---

## 10. Utiliser effect

La fonction \`effect\` exécute un traitement lorsqu'un Signal utilisé dans son corps change.

\`\`\`ts
import { effect, signal } from '@angular/core';

theme = signal<'light' | 'dark'>('light');

constructor() {
  effect(() => {
    console.log('Nouveau thème :', this.theme());
  });
}
\`\`\`

Lorsque le thème change :

\`\`\`ts
this.theme.set('dark');
\`\`\`

L'effet est exécuté à nouveau.

Un effet peut être utile pour :

- enregistrer une préférence dans le stockage local ;
- écrire des informations de débogage ;
- synchroniser une donnée avec une API externe ;
- mettre à jour une bibliothèque qui ne connaît pas les Signals.

---

## 11. Enregistrer une préférence dans localStorage

Voici un exemple de synchronisation d'un thème.

\`\`\`ts
import { effect, signal } from '@angular/core';

type Theme = 'light' | 'dark';

theme = signal<Theme>(
  (localStorage.getItem('theme') as Theme | null) ?? 'light',
);

constructor() {
  effect(() => {
    localStorage.setItem('theme', this.theme());
  });
}

toggleTheme(): void {
  this.theme.update((theme) =>
    theme === 'light' ? 'dark' : 'light',
  );
}
\`\`\`

Le template peut appliquer une classe selon la valeur du Signal.

\`\`\`html
<main [class.dark-theme]="theme() === 'dark'">
  <button type="button" (click)="toggleTheme()">
    Changer de thème
  </button>
</main>
\`\`\`

Il faut toutefois éviter d'utiliser \`effect\` pour calculer une donnée qui pourrait être représentée par un \`computed\`.

---

## 12. Différence entre computed et effect

Un \`computed\` retourne une valeur.

\`\`\`ts
total = computed(() =>
  this.price() * this.quantity(),
);
\`\`\`

Un \`effect\` exécute une action secondaire.

\`\`\`ts
effect(() => {
  console.log('Total modifié :', this.total());
});
\`\`\`

Utilisez donc :

- \`computed\` pour produire une valeur ;
- \`effect\` pour déclencher une action.

Un effet ne devrait pas servir à recopier inutilement une valeur d'un Signal vers un autre.

Exemple à éviter :

\`\`\`ts
effect(() => {
  this.fullname.set(
    \`\${this.firstname()} \${this.lastname()}\`,
  );
});
\`\`\`

Préférez :

\`\`\`ts
fullname = computed(
  () => \`\${this.firstname()} \${this.lastname()}\`,
);
\`\`\`

---

## 13. Utiliser readonly

Un composant ou un service peut exposer une version en lecture seule d'un Signal.

\`\`\`ts
import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SessionService {
  private readonly currentUserState = signal<User | null>(null);

  readonly currentUser = this.currentUserState.asReadonly();

  connect(user: User): void {
    this.currentUserState.set(user);
  }

  disconnect(): void {
    this.currentUserState.set(null);
  }
}
\`\`\`

Les composants peuvent lire \`currentUser\`, mais ne peuvent pas directement modifier le Signal interne.

\`\`\`ts
export class HeaderComponent {
  constructor(
    readonly sessionService: SessionService,
  ) {}
}
\`\`\`

Dans le template :

\`\`\`html
@if (sessionService.currentUser(); as user) {
  <p>Bonjour {{ user.pseudo }}</p>
}
\`\`\`

Cette approche protège l'état du service.

---

## 14. Créer un store simple avec des Signals

Un service peut servir de petit store pour les posts.

\`\`\`ts
import { computed, Injectable, signal } from '@angular/core';

type Post = {
  id: number;
  title: string;
  description: string;
  published_at: Date | null;
};

@Injectable({
  providedIn: 'root',
})
export class PostStore {
  private readonly postsState = signal<Post[]>([]);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<string | null>(null);

  readonly posts = this.postsState.asReadonly();
  readonly isLoading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  readonly publishedPosts = computed(() =>
    this.postsState().filter(
      (post) => post.published_at !== null,
    ),
  );

  readonly drafts = computed(() =>
    this.postsState().filter(
      (post) => post.published_at === null,
    ),
  );

  setPosts(posts: Post[]): void {
    this.postsState.set(posts);
  }

  addPost(post: Post): void {
    this.postsState.update((posts) => [
      post,
      ...posts,
    ]);
  }

  removePost(postId: number): void {
    this.postsState.update((posts) =>
      posts.filter((post) => post.id !== postId),
    );
  }

  setLoading(isLoading: boolean): void {
    this.loadingState.set(isLoading);
  }

  setError(error: string | null): void {
    this.errorState.set(error);
  }
}
\`\`\`

Ce store centralise :

- l'état des posts ;
- l'état de chargement ;
- les erreurs ;
- les valeurs calculées ;
- les méthodes autorisées pour modifier l'état.

---

## 15. Charger des données depuis une API

Les Signals peuvent être combinés avec le client HTTP Angular.

\`\`\`ts
import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PostStore {
  private readonly postsState = signal<Post[]>([]);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<string | null>(null);

  readonly posts = this.postsState.asReadonly();
  readonly isLoading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  constructor(private readonly http: HttpClient) {}

  async loadPosts(): Promise<void> {
    this.loadingState.set(true);
    this.errorState.set(null);

    try {
      const posts = await firstValueFrom(
        this.http.get<Post[]>('/api/posts'),
      );

      this.postsState.set(posts);
    } catch {
      this.errorState.set(
        'Impossible de charger les articles.',
      );
    } finally {
      this.loadingState.set(false);
    }
  }
}
\`\`\`

Dans un composant :

\`\`\`ts
export class PostListComponent {
  constructor(readonly postStore: PostStore) {}

  ngOnInit(): void {
    void this.postStore.loadPosts();
  }
}
\`\`\`

Dans le template :

\`\`\`html
@if (postStore.isLoading()) {
  <p>Chargement des articles...</p>
} @else if (postStore.error(); as error) {
  <p role="alert">{{ error }}</p>
} @else {
  @for (post of postStore.posts(); track post.id) {
    <article>
      <h2>{{ post.title }}</h2>
      <p>{{ post.description }}</p>
    </article>
  } @empty {
    <p>Aucun article disponible.</p>
  }
}
\`\`\`

---

## 16. Utiliser un Signal pour la pagination

Les Signals sont adaptés à la gestion de la page courante.

\`\`\`ts
currentPage = signal(1);
limit = signal(10);
totalPosts = signal(0);

pageCount = computed(() =>
  Math.max(
    1,
    Math.ceil(this.totalPosts() / this.limit()),
  ),
);

hasPreviousPage = computed(
  () => this.currentPage() > 1,
);

hasNextPage = computed(
  () => this.currentPage() < this.pageCount(),
);
\`\`\`

Méthodes de navigation :

\`\`\`ts
goToPreviousPage(): void {
  if (!this.hasPreviousPage()) {
    return;
  }

  this.currentPage.update((page) => page - 1);
}

goToNextPage(): void {
  if (!this.hasNextPage()) {
    return;
  }

  this.currentPage.update((page) => page + 1);
}
\`\`\`

Le template peut désactiver les boutons automatiquement.

\`\`\`html
<nav aria-label="Pagination">
  <button
    type="button"
    [disabled]="!hasPreviousPage()"
    (click)="goToPreviousPage()"
  >
    Précédent
  </button>

  <span>
    Page {{ currentPage() }} sur {{ pageCount() }}
  </span>

  <button
    type="button"
    [disabled]="!hasNextPage()"
    (click)="goToNextPage()"
  >
    Suivant
  </button>
</nav>
\`\`\`

---

## 17. Utiliser input avec les Signals

Dans les composants Angular récents, il est possible d'utiliser des inputs basés sur les Signals.

\`\`\`ts
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-post-card',
  template: \`
    <article>
      <h2>{{ title() }}</h2>
      <p>{{ description() }}</p>
    </article>
  \`,
})
export class PostCardComponent {
  title = input.required<string>();
  description = input.required<string>();
}
\`\`\`

Le composant parent fournit les valeurs :

\`\`\`html
<app-post-card
  [title]="post.title"
  [description]="post.description"
/>
\`\`\`

Un input Signal est en lecture seule dans le composant enfant.

---

## 18. Transformer un input avec computed

Un input peut être utilisé dans une valeur calculée.

\`\`\`ts
import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-user-name',
  template: \`
    <p>{{ displayName() }}</p>
  \`,
})
export class UserNameComponent {
  firstname = input.required<string>();
  lastname = input.required<string>();

  displayName = computed(() =>
    \`\${this.firstname()} \${this.lastname()}\`,
  );
}
\`\`\`

La valeur calculée est mise à jour dès qu'un input change.

---

## 19. Utiliser model pour une valeur modifiable

La fonction \`model\` peut servir à créer une liaison bidirectionnelle.

\`\`\`ts
import { Component, model } from '@angular/core';

@Component({
  selector: 'app-search-input',
  template: \`
    <input
      type="search"
      [value]="value()"
      (input)="value.set($any($event.target).value)"
    />
  \`,
})
export class SearchInputComponent {
  value = model('');
}
\`\`\`

Dans le parent :

\`\`\`html
<app-search-input [(value)]="search" />
\`\`\`

Cette approche peut simplifier certains composants de formulaire personnalisés.

---

## 20. Signals et RxJS

Les Signals sont pratiques pour représenter un état courant.

RxJS est particulièrement utile pour :

- gérer des flux asynchrones ;
- annuler des requêtes ;
- combiner plusieurs événements ;
- appliquer un délai avec \`debounceTime\` ;
- gérer les WebSockets ;
- traiter des événements successifs ;
- construire des pipelines complexes.

Un Observable peut être converti en Signal avec \`toSignal\`.

\`\`\`ts
import { toSignal } from '@angular/core/rxjs-interop';

posts = toSignal(
  this.http.get<Post[]>('/api/posts'),
  {
    initialValue: [],
  },
);
\`\`\`

Le template peut ensuite lire la valeur comme un Signal.

\`\`\`html
@for (post of posts(); track post.id) {
  <article>
    <h2>{{ post.title }}</h2>
  </article>
}
\`\`\`

Il est également possible de convertir un Signal en Observable avec \`toObservable\`.

\`\`\`ts
import { toObservable } from '@angular/core/rxjs-interop';
import { debounceTime, switchMap } from 'rxjs';

search = signal('');

results$ = toObservable(this.search).pipe(
  debounceTime(300),
  switchMap((search) =>
    this.http.get<Post[]>('/api/posts', {
      params: {
        search,
      },
    }),
  ),
);
\`\`\`

Ici, le Signal représente la recherche courante et RxJS gère le délai ainsi que les requêtes successives.

---

## 21. Exemple de recherche avec annulation automatique

L'opérateur \`switchMap\` annule la requête précédente lorsqu'une nouvelle recherche commence.

\`\`\`ts
search = signal('');

searchResults = toSignal(
  toObservable(this.search).pipe(
    debounceTime(300),
    distinctUntilChanged(),
    switchMap((search) =>
      this.http.get<Post[]>('/api/posts', {
        params: {
          search,
        },
      }),
    ),
  ),
  {
    initialValue: [],
  },
);
\`\`\`

Dans le template :

\`\`\`html
<input
  type="search"
  [value]="search()"
  (input)="search.set($any($event.target).value)"
/>

@for (post of searchResults(); track post.id) {
  <article>
    <h2>{{ post.title }}</h2>
  </article>
}
\`\`\`

Cet exemple montre que Signals et RxJS peuvent être complémentaires.

---

## 22. Bonnes pratiques

### Garder les Signals privés lorsqu'ils sont modifiables

Dans un service, exposez une version en lecture seule.

\`\`\`ts
private readonly postsState = signal<Post[]>([]);

readonly posts = this.postsState.asReadonly();
\`\`\`

### Utiliser computed pour les données dérivées

Évitez de stocker une valeur qui peut être calculée.

\`\`\`ts
publishedCount = computed(
  () => this.posts().filter(
    (post) => post.published_at !== null,
  ).length,
);
\`\`\`

### Éviter les effets inutiles

Un effet doit servir à déclencher une action secondaire, pas à recopier des données.

### Ne pas modifier directement les tableaux et objets

Créez de nouvelles références avec \`update\`, le spread operator, \`map\` ou \`filter\`.

### Donner des noms explicites

Préférez :

\`\`\`ts
currentPage = signal(1);
selectedPostId = signal<number | null>(null);
isEditorFullscreen = signal(false);
\`\`\`

Évitez les noms trop génériques comme \`data\`, \`value\` ou \`state\` lorsqu'ils ne décrivent pas clairement leur rôle.

---

## 23. Erreurs fréquentes

### Oublier les parenthèses

Un Signal doit être appelé pour lire sa valeur.

Incorrect :

\`\`\`html
<p>{{ counter }}</p>
\`\`\`

Correct :

\`\`\`html
<p>{{ counter() }}</p>
\`\`\`

### Modifier directement un tableau

Incorrect :

\`\`\`ts
this.posts().push(post);
\`\`\`

Correct :

\`\`\`ts
this.posts.update((posts) => [...posts, post]);
\`\`\`

### Utiliser un effect à la place d'un computed

Incorrect :

\`\`\`ts
effect(() => {
  this.total.set(
    this.price() * this.quantity(),
  );
});
\`\`\`

Correct :

\`\`\`ts
total = computed(
  () => this.price() * this.quantity(),
);
\`\`\`

### Exposer un WritableSignal publiquement

Dans un service partagé, cela permettrait à n'importe quel composant de modifier directement l'état.

Préférez une version en lecture seule et des méthodes métier dédiées.

---

## 24. Exemple complet de liste de posts

Voici un exemple plus complet regroupant plusieurs concepts.

\`\`\`ts
import {
  Component,
  computed,
  signal,
} from '@angular/core';

type Post = {
  id: number;
  title: string;
  description: string;
  published_at: Date | null;
};

@Component({
  selector: 'app-post-list',
  templateUrl: './post-list.component.html',
})
export class PostListComponent {
  posts = signal<Post[]>([
    {
      id: 1,
      title: 'Découvrir Angular Signals',
      description: 'Introduction aux Signals.',
      published_at: new Date(),
    },
    {
      id: 2,
      title: 'Mon futur article',
      description: 'Un article encore en rédaction.',
      published_at: null,
    },
  ]);

  search = signal('');
  showDrafts = signal(false);

  visiblePosts = computed(() => {
    const normalizedSearch = this.search()
      .trim()
      .toLowerCase();

    return this.posts().filter((post) => {
      const matchesPublicationStatus =
        this.showDrafts() ||
        post.published_at !== null;

      const matchesSearch =
        !normalizedSearch ||
        post.title
          .toLowerCase()
          .includes(normalizedSearch);

      return matchesPublicationStatus && matchesSearch;
    });
  });

  toggleDrafts(): void {
    this.showDrafts.update((value) => !value);
  }

  deletePost(postId: number): void {
    this.posts.update((posts) =>
      posts.filter((post) => post.id !== postId),
    );
  }
}
\`\`\`

Template associé :

\`\`\`html
<section>
  <header>
    <h1>Articles</h1>

    <input
      type="search"
      [value]="search()"
      (input)="search.set($any($event.target).value)"
      placeholder="Rechercher un article"
    />

    <button type="button" (click)="toggleDrafts()">
      {{ showDrafts()
        ? 'Masquer les brouillons'
        : 'Afficher les brouillons'
      }}
    </button>
  </header>

  @for (post of visiblePosts(); track post.id) {
    <article>
      <h2>{{ post.title }}</h2>
      <p>{{ post.description }}</p>

      @if (post.published_at) {
        <small>Article publié</small>
      } @else {
        <small>Brouillon</small>
      }

      <button
        type="button"
        (click)="deletePost(post.id)"
      >
        Supprimer
      </button>
    </article>
  } @empty {
    <p>Aucun article ne correspond à la recherche.</p>
  }
</section>
\`\`\`

---

## 25. Quand utiliser les Signals

Les Signals sont adaptés lorsque l'application doit représenter une valeur courante :

- l'utilisateur connecté ;
- la page actuelle ;
- le thème sélectionné ;
- les préférences d'affichage ;
- une liste de posts ;
- un brouillon local ;
- l'ouverture d'une fenêtre modale ;
- l'état d'un formulaire personnalisé ;
- une valeur calculée à partir d'autres états.

RxJS reste souvent préférable pour représenter une succession d'événements asynchrones complexes.

Le meilleur choix n'est donc pas toujours de remplacer tous les Observables par des Signals.

---

## Conclusion

Angular Signals apporte une manière simple et explicite de gérer l'état réactif.

Les éléments essentiels à retenir sont :

- \`signal\` crée une valeur réactive ;
- \`set\` remplace sa valeur ;
- \`update\` calcule une nouvelle valeur ;
- \`computed\` produit une valeur dérivée ;
- \`effect\` déclenche une action secondaire ;
- \`asReadonly\` protège un état partagé ;
- Signals et RxJS peuvent être utilisés ensemble.

Pour une application Angular moderne, les Signals permettent de créer des composants plus lisibles et des services d'état plus faciles à maintenir. L'essentiel est de conserver une séparation claire entre l'état, les valeurs calculées et les effets secondaires.
`,
  published_at: new Date('2026-01-12T10:00:00.000Z'),
},
  {
    title: 'Construire une API REST avec NestJS',
    description:
      'Apprenez à structurer une API avec les modules, contrôleurs et services NestJS.',
    content: `
# Construire une API REST avec NestJS

NestJS encourage une architecture modulaire et maintenable.

## Le contrôleur

Le contrôleur reçoit la requête HTTP et délègue le traitement au service.

\`\`\`ts
@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get()
  findAll() {
    return this.postService.findAll();
  }
}
\`\`\`

## Le service

Le service contient la logique métier.

\`\`\`ts
@Injectable()
export class PostService {
  findAll() {
    return [];
  }
}
\`\`\`

Un contrôleur doit rester léger.
`,
    published_at: new Date('2026-01-18T14:30:00.000Z'),
  },
  {
    title: 'Comprendre Prisma ORM',
    description:
      'Une introduction aux modèles, migrations et requêtes avec Prisma.',
    content: `
# Comprendre Prisma ORM

Prisma est un ORM moderne conçu pour TypeScript et Node.js.

## Définir un modèle

\`\`\`prisma
model Post {
  id          Int    @id @default(autoincrement())
  authorId    Int
  title       String
  description String
  content     String @db.Text
}
\`\`\`

## Récupérer les posts

\`\`\`ts
const posts = await prisma.post.findMany({
  include: {
    author: true,
  },
});
\`\`\`

Prisma génère automatiquement les types correspondant au schéma.
`,
    published_at: new Date('2026-01-25T08:45:00.000Z'),
  },
  {
    title: 'Les principes SOLID en TypeScript',
    description:
      'Découvrez comment appliquer les principes SOLID dans une application TypeScript.',
    content: `
# Les principes SOLID en TypeScript

SOLID regroupe cinq principes de conception logicielle.

## Single Responsibility Principle

Une classe ne devrait avoir qu'une seule responsabilité.

## Open Closed Principle

Une classe devrait être ouverte à l'extension, mais fermée à la modification.

## Liskov Substitution Principle

Une implémentation doit pouvoir remplacer son abstraction sans modifier le comportement attendu.

## Interface Segregation Principle

Il vaut mieux plusieurs petites interfaces qu'une seule interface trop générale.

## Dependency Inversion Principle

Les modules métier doivent dépendre d'abstractions.
`,
    published_at: new Date('2026-02-02T16:00:00.000Z'),
  },
  {
    title: 'Créer une pagination avec NestJS et Prisma',
    description:
      'Mettez en place une pagination côté serveur avec Prisma.',
    content: `
# Créer une pagination côté serveur

La pagination évite de charger toutes les données en une seule requête.

## Calculer le décalage

\`\`\`ts
const skip = (page - 1) * limit;
\`\`\`

## Requête Prisma

\`\`\`ts
const posts = await prisma.post.findMany({
  skip,
  take: limit,
  orderBy: {
    created_at: 'desc',
  },
});
\`\`\`

Le nombre total d'éléments peut être récupéré avec \`prisma.post.count()\`.
`,
    published_at: new Date('2026-02-10T11:20:00.000Z'),
  },
  {
    title: 'Gérer les erreurs dans NestJS',
    description:
      'Utilisez les exceptions HTTP de NestJS pour retourner des erreurs cohérentes.',
    content: `
# Gérer les erreurs dans NestJS

NestJS fournit plusieurs exceptions HTTP prêtes à l'emploi.

\`\`\`ts
throw new NotFoundException('Article introuvable');
\`\`\`

## Exceptions fréquentes

- BadRequestException
- UnauthorizedException
- ForbiddenException
- NotFoundException
- ConflictException

Un filtre global peut également uniformiser la structure des réponses d'erreur.
`,
    published_at: new Date('2026-02-16T09:15:00.000Z'),
  },
  {
    title: 'Introduction à RxJS',
    description:
      'Comprendre les Observables, les opérateurs et les abonnements avec RxJS.',
    content: `
# Introduction à RxJS

RxJS permet de manipuler des flux de données asynchrones.

## Créer un Observable

\`\`\`ts
import { of } from 'rxjs';

const numbers$ = of(1, 2, 3);

numbers$.subscribe((value) => {
  console.log(value);
});
\`\`\`

## Transformer les valeurs

\`\`\`ts
numbers$
  .pipe(map((value) => value * 2))
  .subscribe(console.log);
\`\`\`

Les Observables sont notamment utilisés par le client HTTP d'Angular.
`,
    published_at: new Date('2026-02-21T13:00:00.000Z'),
  },
  {
    title: 'Sécuriser une route avec un Guard NestJS',
    description:
      'Protégez les endpoints de votre API avec un guard personnalisé.',
    content: `
# Sécuriser une route avec un Guard

Un guard détermine si une requête peut accéder à une route.

\`\`\`ts
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    return Boolean(request.user);
  }
}
\`\`\`

Le guard peut être appliqué sur une méthode ou sur un contrôleur entier.

\`\`\`ts
@UseGuards(AuthGuard)
@Get('profile')
getProfile() {
  return this.userService.getProfile();
}
\`\`\`
`,
    published_at: new Date('2026-03-01T12:10:00.000Z'),
  },
  {
    title: 'Dockeriser une application NestJS',
    description:
      'Créez une image Docker pour exécuter une API NestJS.',
    content: `
# Dockeriser une application NestJS

Docker permet d'exécuter une application dans un environnement reproductible.

## Exemple de Dockerfile

\`\`\`dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

CMD ["npm", "run", "start:prod"]
\`\`\`

Une construction multi-stage permet de réduire la taille de l'image finale.
`,
    published_at: new Date('2026-03-08T17:40:00.000Z'),
  },
  {
    title: 'Comprendre les relations avec Prisma',
    description:
      'Découvrez comment relier des utilisateurs et des posts avec Prisma.',
    content: `
# Comprendre les relations Prisma

Une relation permet de connecter plusieurs modèles.

\`\`\`prisma
model Post {
  id       Int @id @default(autoincrement())
  authorId Int

  author User @relation(
    fields: [authorId],
    references: [id],
    onDelete: Cascade
  )
}
\`\`\`

Lors de la création d'un post, l'identifiant de l'auteur doit être fourni.

\`\`\`ts
await prisma.post.create({
  data: {
    authorId: user.id,
    title: 'Mon article',
    description: 'Description',
    content: 'Contenu',
  },
});
\`\`\`
`,
    published_at: new Date('2026-03-14T09:30:00.000Z'),
  },
  {
    title: 'Créer un système de brouillons',
    description:
      'Enregistrez un post sans le publier immédiatement grâce au champ published_at.',
    content: `
# Créer un système de brouillons

Dans le modèle Post, un article est un brouillon lorsque
\`published_at\` vaut \`null\`.

\`\`\`ts
const draft = await prisma.post.create({
  data: {
    authorId: user.id,
    title: 'Mon brouillon',
    description: 'Un article en cours de rédaction',
    content: 'Contenu temporaire',
    published_at: null,
  },
});
\`\`\`

Pour publier le brouillon, il suffit de renseigner sa date de publication.
`,
    published_at: null,
  },
  {
    title: 'Mettre en place Redis avec NestJS',
    description:
      'Une introduction à Redis pour stocker des données temporaires.',
    content: `
# Mettre en place Redis avec NestJS

Redis est une base de données en mémoire adaptée au cache et aux sessions.

## Exemple d'utilisation

\`\`\`ts
await redis.set('user:1', JSON.stringify(user));

const cachedUser = await redis.get('user:1');
\`\`\`

Une durée de vie peut être ajoutée aux données.

\`\`\`ts
await redis.set(
  'user:1',
  JSON.stringify(user),
  'EX',
  3600,
);
\`\`\`

Le cache permet de limiter certaines requêtes répétitives en base de données.
`,
    published_at: new Date('2026-03-22T15:20:00.000Z'),
  },
  {
    title: 'Découvrir BullMQ',
    description:
      'Utilisez BullMQ pour exécuter des tâches asynchrones avec Redis.',
    content: `
# Découvrir BullMQ

BullMQ permet de gérer des files d'attente basées sur Redis.

## Ajouter une tâche

\`\`\`ts
await emailQueue.add('send-email', {
  recipient: 'utilisateur@example.com',
  subject: 'Bienvenue',
});
\`\`\`

## Traiter une tâche

\`\`\`ts
@Processor('email')
export class EmailProcessor extends WorkerHost {
  async process(job: Job) {
    console.log(job.data);
  }
}
\`\`\`

Les files d'attente sont utiles pour les emails, les traitements d'images
ou les tâches longues.
`,
    published_at: new Date('2026-03-30T18:10:00.000Z'),
  },
  {
    title: 'Créer un interceptor NestJS',
    description:
      'Transformez les réponses de votre API avec un interceptor NestJS.',
    content: `
# Créer un interceptor NestJS

Un interceptor peut modifier la réponse retournée par une route.

\`\`\`ts
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
      })),
    );
  }
}
\`\`\`

Il peut être enregistré globalement ou appliqué uniquement sur certaines routes.
`,
    published_at: new Date('2026-04-05T10:40:00.000Z'),
  },
  {
    title: 'Optimiser les requêtes Prisma',
    description:
      'Quelques bonnes pratiques pour limiter les données récupérées avec Prisma.',
    content: `
# Optimiser les requêtes Prisma

Il est important de ne récupérer que les données nécessaires.

## Utiliser select

\`\`\`ts
const users = await prisma.user.findMany({
  select: {
    id: true,
    pseudo: true,
  },
});
\`\`\`

## Utiliser include avec modération

\`\`\`ts
const post = await prisma.post.findUnique({
  where: {
    id: 1,
  },
  include: {
    author: true,
  },
});
\`\`\`

Une requête précise consomme moins de mémoire et transfère moins de données.
`,
    published_at: new Date('2026-04-12T08:30:00.000Z'),
  },
  {
    title: 'Tester un service NestJS avec Jest',
    description:
      'Découvrez comment créer des tests unitaires pour un service NestJS.',
    content: `
# Tester un service NestJS avec Jest

Les dépendances d'un service peuvent être remplacées par des mocks.

\`\`\`ts
describe('PostService', () => {
  let service: PostService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        PostService,
        {
          provide: PrismaService,
          useValue: {
            post: {
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get(PostService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
\`\`\`
`,
    published_at: new Date('2026-04-19T14:50:00.000Z'),
  },
  {
    title: 'Utiliser les Resources Angular',
    description:
      'Chargez des données asynchrones avec la Resource API d’Angular.',
    content: `
# Utiliser les Resources Angular

Une resource permet de gérer le chargement de données asynchrones.

\`\`\`ts
posts = resource({
  loader: async () => {
    return this.postService.getAllPublishedPosts();
  },
});
\`\`\`

La resource expose notamment :

- value
- isLoading
- error
- reload

Elle peut être utilisée directement dans le template.
`,
    published_at: new Date('2026-04-26T11:00:00.000Z'),
  },
  {
    title: 'Créer un composant Toast accessible',
    description:
      'Affichez des notifications accessibles dans une application Angular.',
    content: `
# Créer un composant Toast accessible

Une notification doit utiliser un rôle adapté à son importance.

\`\`\`html
<section
  role="status"
  aria-live="polite"
  aria-atomic="true"
>
  Article enregistré
</section>
\`\`\`

Une erreur importante peut utiliser le rôle \`alert\`.

\`\`\`html
<section role="alert" aria-live="assertive">
  Une erreur est survenue
</section>
\`\`\`

Les animations doivent également respecter les préférences de réduction
des mouvements.
`,
    published_at: new Date('2026-05-03T16:15:00.000Z'),
  },
  {
    title: 'Refactoriser un contrôleur NestJS',
    description:
      'Conservez des contrôleurs légers en déplaçant la logique métier dans les services.',
    content: `
# Refactoriser un contrôleur NestJS

Un contrôleur ne devrait pas contenir directement la logique métier.

## À éviter

\`\`\`ts
@Post()
async create(@Body() dto: CreatePostDto) {
  return this.prisma.post.create({
    data: {
      ...dto,
    },
  });
}
\`\`\`

## Approche recommandée

\`\`\`ts
@Post()
create(@Body() dto: CreatePostDto) {
  return this.postService.create(dto);
}
\`\`\`

Le service devient responsable de la création du post.
`,
    published_at: null,
  },
];