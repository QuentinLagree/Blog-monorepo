import {
  DatePipe,
  DOCUMENT,
} from '@angular/common';
import { HttpContext } from '@angular/common/http';
import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  ViewChild,
  computed,
  effect,
  inject,
  resource,
  signal,
  WritableSignal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  ActivatedRoute,
  Router,
  RouterLink,
} from '@angular/router';
import { MarkdownComponent } from 'ngx-markdown';
import {
  distinctUntilChanged,
  firstValueFrom,
  map,
} from 'rxjs';

import { UserPreferencesService } from 'src/app/features/account/pages/profil/preferences.service';
import { SUCCESS_MESSAGE } from 'src/app/shared/helpers/toasts/models/toasts.config';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb';
import { SessionService } from 'src/app/shared/services/session.service';
import {
  User,
  UserService,
} from 'src/app/shared/services/user.service';
import { Message } from 'src/app/shared/types/message.type';
import { BaseButtonComponent } from 'src/app/shared/ui/form/buttons/base-button';

import { PostService } from '../../data-access/post.service';
import { PostLikeStatus } from '../../model/post-like-status.model';
import { Post } from '../../model/post.model';

const SILENT_CONTEXT = new HttpContext().set(
  SUCCESS_MESSAGE,
  false,
);

const READING_PANEL_STORAGE_KEY =
  'post-detail-reading-panel-opened';

type TableOfContentsItem = {
  id: string;
  label: string;
  level: 2 | 3;
};

@Component({
  selector: 'app-post-detail',
  standalone: true,
  imports: [
    MarkdownComponent,
    DatePipe,
    BaseButtonComponent,
    RouterLink,
  ],
  templateUrl: './post-detail.html',
  styleUrls: [
    './post-detail.scss',
    '../../../../core/layouts/landing/landing.scss',
  ],
})
export class PostDetailComponent implements AfterViewInit {
  @ViewChild('markdownContent', {
    read: ElementRef,
  })
  private markdownContent?: ElementRef<HTMLElement>;

  private readonly _activatedRoute =
    inject(ActivatedRoute);

  private readonly _router =
    inject(Router);

  private readonly _userService =
    inject(UserService);

  private readonly _postService =
    inject(PostService);

  private readonly _sessionService =
    inject(SessionService);

  private readonly _preferences =
    inject(UserPreferencesService);

  private readonly _breadCrumb =
    inject(BreadcrumbService);

  private readonly _document =
    inject(DOCUMENT);

  private readonly _destroyRef =
    inject(DestroyRef);

  private headingObserver?: IntersectionObserver;
  private resizeObserver?: ResizeObserver;
  private markdownInitializationTimeout?: number;

  private viewInitialized = false;
  private secondaryDataPostId: number | null = null;

  private readonly lastSavedProgress =
    signal<number | null>(null);

  readonly readingPanelOpened = signal(
    this.getInitialReadingPanelState(),
  );

  readonly author: WritableSignal<User | undefined> =
    signal(undefined);

  readonly likesCount = signal(0);
  readonly hasLiked = signal(false);
  readonly likeLoading = signal(false);
  readonly isAuthor = signal(false);

  readonly tableOfContents =
    signal<TableOfContentsItem[]>([]);

  readonly activeHeadingIndex =
    signal(0);

  readonly readingProgress =
    signal(0);

  readonly mobileSummaryOpened =
    signal(false);

  readonly activeHeading = computed(() => {
    const headings =
      this.tableOfContents();

    return (
      headings[this.activeHeadingIndex()] ??
      headings[0] ??
      null
    );
  });

  readonly readSaved =
    signal(false);

  readonly readSaving =
    signal(false);

  readonly showReadingTime =
    this._preferences.showReadingTime;

  private readonly routeSlug = toSignal(
    this._activatedRoute.paramMap.pipe(
      map((params) => {
        const slug =
          params.get('title')?.trim();

        return slug || undefined;
      }),
      distinctUntilChanged(),
    ),
    {
      initialValue:
        this._activatedRoute.snapshot.paramMap
          .get('title')
          ?.trim() || undefined,
    },
  );

  readonly slugTitle =
    this.routeSlug;

  readonly post = resource<
    Post,
    string | undefined
  >({
    params: () =>
      this.routeSlug(),

    loader: async ({
      params: slug,
    }): Promise<Post> => {
      if (!slug) {
        throw new Error(
          "Le slug de l'article est manquant.",
        );
      }

      this.resetPostState();

      try {
        const postResponse: Message<Post> =
          await firstValueFrom(
            this._postService.getPublishedDetail(
              slug,
              {
                context: SILENT_CONTEXT,
              },
            ),
          );

        if (!postResponse?.data) {
          throw new Error(
            "L'article demandé est introuvable.",
          );
        }

        const currentPost =
          postResponse.data;

        this._breadCrumb.setWithHome([
          {
            label: 'Articles',
            url: '/home',
          },
          {
            label: currentPost.title,
          },
        ]);

        this.checkPostAccess(
          currentPost,
        );

        return currentPost;
      } catch (error: unknown) {
        const normalizedError =
          this.normalizeError(error);

        console.error(
          "Erreur lors du chargement de l'article :",
          normalizedError,
          normalizedError.cause,
        );

        throw normalizedError;
      }
    },
  });

  constructor() {
    effect(() => {
      const currentPost =
        this.post.value();

      if (!currentPost) {
        return;
      }

      if (
        this.secondaryDataPostId !==
        currentPost.id
      ) {
        this.secondaryDataPostId =
          currentPost.id ?? null;

        void this.loadSecondaryData(
          currentPost,
        );
      }

      if (this.viewInitialized) {
        this.scheduleReadingNavigationInitialization();
      }
    });

    this._destroyRef.onDestroy(() => {
      this.saveCurrentReading();
      this.destroyReadingNavigation();
    });
  }

  ngAfterViewInit(): void {
    this.viewInitialized = true;

    if (this.post.hasValue()) {
      this.scheduleReadingNavigationInitialization();
    }
  }

  private async loadSecondaryData(
    post: Post,
  ): Promise<void> {
    await this.loadAuthor(post);

    const sessionId =
      this._sessionService.getUserIdSync();

    if (!sessionId || !post.id) {
      return;
    }

    await this.loadLikeStatus(
      post.id,
    );
  }

  private resetPostState(): void {
    this.author.set(undefined);
    this.isAuthor.set(false);

    this.likesCount.set(0);
    this.hasLiked.set(false);
    this.likeLoading.set(false);

    this.secondaryDataPostId = null;

    this.resetReadingNavigation();
  }

  private resetReadingNavigation(): void {
    this.tableOfContents.set([]);
    this.activeHeadingIndex.set(0);
    this.readingProgress.set(0);
    this.mobileSummaryOpened.set(false);

    this.readSaved.set(false);
    this.readSaving.set(false);
    this.lastSavedProgress.set(null);
  }

  private checkPostAccess(
    post: Post,
  ): void {
    const sessionId =
      this._sessionService.getUserIdSync();

    const isUnpublished =
      post.published_at == null;

    const isPostAuthor =
      sessionId === post.authorId;

    if (
      isUnpublished &&
      !isPostAuthor
    ) {
      void this._router.navigate([
        '/home',
      ]);

      throw new Error(
        "Vous n'êtes pas autorisé à consulter cet article.",
      );
    }
  }

  private async loadAuthor(
    post: Post,
  ): Promise<void> {
    if (!post.authorId) {
      this.author.set(undefined);
      this.isAuthor.set(false);
      return;
    }

    try {
      const userResponse: Message<User> =
        await firstValueFrom(
          this._userService.findUserWithId(
            post.authorId,
            {
              context: SILENT_CONTEXT,
            },
          ),
        );

      if (!userResponse?.data) {
        this.author.set(undefined);
        this.isAuthor.set(false);
        return;
      }

      const sessionId =
        this._sessionService.getUserIdSync();

      this.isAuthor.set(
        userResponse.data.id === sessionId,
      );

      this.author.set(
        userResponse.data,
      );
    } catch (error: unknown) {
      this.author.set(undefined);
      this.isAuthor.set(false);

      console.error(
        "Impossible de charger l'auteur.",
        error,
      );
    }
  }

  private async loadLikeStatus(
    postId: number,
  ): Promise<void> {
    const sessionId =
      this._sessionService.getUserIdSync();

    if (!sessionId) {
      this.hasLiked.set(false);
      return;
    }

    try {
      const response: Message<PostLikeStatus> =
        await firstValueFrom(
          this._postService.getStatusLike(
            postId,
            {
              context: SILENT_CONTEXT,
            },
          ),
        );

      if (!response?.data) {
        throw new Error(
          "La réponse de l'API ne contient pas le statut du like.",
        );
      }

      this.hasLiked.set(
        response.data.liked,
      );

      this.likesCount.set(
        response.data.likesCount,
      );
    } catch (error: unknown) {
      this.hasLiked.set(false);

      console.error(
        'Impossible de charger le statut du like.',
        error,
      );
    }
  }

  async toggleLike(): Promise<void> {
    if (
      this.likeLoading() ||
      !this.post.hasValue()
    ) {
      return;
    }

    const postId =
      this.post.value().id;

    if (!postId) {
      return;
    }

    const sessionId =
      this._sessionService.getUserIdSync();

    if (!sessionId) {
      console.error(
        'Vous devez être connecté pour aimer un article.',
      );

      return;
    }

    const previousLiked =
      this.hasLiked();

    const previousCount =
      this.likesCount();

    const nextLiked =
      !previousLiked;

    this.likeLoading.set(true);
    this.hasLiked.set(nextLiked);

    this.likesCount.set(
      nextLiked
        ? previousCount + 1
        : Math.max(
          0,
          previousCount - 1,
        ),
    );

    try {
      const response: Message<PostLikeStatus> =
        nextLiked
          ? await firstValueFrom(
            this._postService.likePost(
              postId,
              {
                context: SILENT_CONTEXT,
              },
            ),
          )
          : await firstValueFrom(
            this._postService.unlikePost(
              postId,
              {
                context: SILENT_CONTEXT,
              },
            ),
          );

      if (!response?.data) {
        throw new Error(
          "L'API n'a pas retourné le nouveau statut du like.",
        );
      }

      this.hasLiked.set(
        response.data.liked,
      );

      this.likesCount.set(
        response.data.likesCount,
      );
    } catch (error: unknown) {
      this.hasLiked.set(
        previousLiked,
      );

      this.likesCount.set(
        previousCount,
      );

      console.error(
        'Impossible de modifier le like.',
        error,
      );
    } finally {
      this.likeLoading.set(false);
    }
  }

  readingTime(): number {
    const content =
      this.post.value()?.content;

    if (!content?.trim()) {
      return 1;
    }

    const words = content
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .length;

    return Math.max(
      1,
      Math.ceil(words / 200),
    );
  }

  scrollToHeading(
    headingId: string,
  ): void {
    const heading =
      this._document.getElementById(
        headingId,
      );

    if (!heading) {
      return;
    }

    heading.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });

    this.closeMobileSummary();
  }

  toggleMobileSummary(): void {
    this.mobileSummaryOpened.update(
      (opened) => !opened,
    );
  }

  closeMobileSummary(): void {
    this.mobileSummaryOpened.set(false);
  }

  contribute(): void {
    if (!this.post.hasValue()) {
      return;
    }

    const post =
      this.post.value();

    void this._router.navigate(
      [
        '/posts',
        post.id,
        'contribute',
      ],
      {
        queryParams: {
          title: post.title,
        },
      },
    );
  }

  sharePost(): void {
    if (!this.post.hasValue()) {
      return;
    }

    const post =
      this.post.value();

    const url =
      window.location.href;

    if (navigator.share) {
      void navigator.share({
        title: post.title,
        text: post.description,
        url,
      });

      return;
    }

    void navigator.clipboard.writeText(
      url,
    );
  }

  goBack(): void {
    void this._router.navigate([
      '/home',
    ]);
  }

  private scheduleReadingNavigationInitialization(): void {
    if (
      typeof window === 'undefined' ||
      !this.viewInitialized
    ) {
      return;
    }

    if (
      this.markdownInitializationTimeout
    ) {
      window.clearTimeout(
        this.markdownInitializationTimeout,
      );
    }

    this.markdownInitializationTimeout =
      window.setTimeout(() => {
        this.markdownInitializationTimeout =
          undefined;

        this.initializeReadingNavigation();
      }, 0);
  }

  private initializeReadingNavigation(): void {
    const markdownElement =
      this.markdownContent?.nativeElement;

    if (!markdownElement) {
      return;
    }

    this.headingObserver?.disconnect();
    this.resizeObserver?.disconnect();

    const headingElements =
      Array.from(
        markdownElement.querySelectorAll<HTMLElement>(
          'h2, h3',
        ),
      );

    const headings =
      headingElements.map(
        (
          heading,
          index,
        ): TableOfContentsItem => {
          const id =
            heading.id ||
            this.createHeadingId(
              heading.textContent ?? '',
              index,
            );

          heading.id = id;

          return {
            id,
            label:
              heading.textContent?.trim() ||
              `Section ${index + 1}`,
            level:
              heading.tagName === 'H3'
                ? 3
                : 2,
          };
        },
      );

    this.tableOfContents.set(
      headings,
    );

    this.activeHeadingIndex.set(0);

    this.observeHeadings(
      headingElements,
    );

    window.removeEventListener(
      'scroll',
      this.updateReadingProgress,
    );

    window.addEventListener(
      'scroll',
      this.updateReadingProgress,
      {
        passive: true,
      },
    );

    this.resizeObserver =
      new ResizeObserver(() => {
        this.updateReadingProgress();
      });

    this.resizeObserver.observe(
      markdownElement,
    );

    this.updateReadingProgress();
    this.findClosestHeading(
      headingElements,
    );
  }

  private observeHeadings(
    headings: HTMLElement[],
  ): void {
    if (!headings.length) {
      return;
    }

    this.headingObserver =
      new IntersectionObserver(
        (entries) => {
          const visibleEntries =
            entries
              .filter(
                (entry) =>
                  entry.isIntersecting,
              )
              .sort(
                (
                  first,
                  second,
                ) =>
                  first.boundingClientRect.top -
                  second.boundingClientRect.top,
              );

          const currentEntry =
            visibleEntries[0];

          if (!currentEntry) {
            this.findClosestHeading(
              headings,
            );
            return;
          }

          const index =
            headings.indexOf(
              currentEntry.target as HTMLElement,
            );

          if (index >= 0) {
            this.activeHeadingIndex.set(
              index,
            );
          }
        },
        {
          rootMargin:
            '-18% 0px -68% 0px',
          threshold: [0, 1],
        },
      );

    headings.forEach((heading) => {
      this.headingObserver?.observe(
        heading,
      );
    });
  }

  private findClosestHeading(
    headings: HTMLElement[],
  ): void {
    if (!headings.length) {
      return;
    }

    const readingLine =
      window.innerHeight * 0.28;

    let closestIndex = 0;
    let closestDistance =
      Number.POSITIVE_INFINITY;

    headings.forEach(
      (
        heading,
        index,
      ) => {
        const distance =
          Math.abs(
            heading.getBoundingClientRect().top -
            readingLine,
          );

        if (
          distance <
          closestDistance
        ) {
          closestDistance =
            distance;

          closestIndex =
            index;
        }
      },
    );

    this.activeHeadingIndex.set(
      closestIndex,
    );
  }

  private readonly updateReadingProgress =
  (): void => {
    const markdownElement =
      this.markdownContent?.nativeElement;

    if (!markdownElement) {
      return;
    }

    const bounds =
      markdownElement.getBoundingClientRect();

    const viewportHeight =
      window.innerHeight;

    const articleStart =
      window.scrollY +
      bounds.top -
      viewportHeight * 0.25;

    const articleEnd =
      articleStart +
      markdownElement.offsetHeight -
      viewportHeight * 0.5;

    const readingDistance =
      articleEnd -
      articleStart;

    let normalizedProgress = 0;

    if (readingDistance <= 0) {
      normalizedProgress = 100;
    } else {
      const progress =
        ((window.scrollY -
          articleStart) /
          readingDistance) *
        100;

      normalizedProgress =
        Math.round(
          Math.min(
            100,
            Math.max(
              0,
              progress,
            ),
          ),
        );
    }

    this.readingProgress.set(
      normalizedProgress,
    );

    if (
      normalizedProgress >= 80 &&
      !this.readSaved() &&
      !this.readSaving()
    ) {
      void this.savePostAsRead();
    }

    const headings =
      Array.from(
        markdownElement.querySelectorAll<HTMLElement>(
          'h2, h3',
        ),
      );

    this.findClosestHeading(
      headings,
    );
  };

  private createHeadingId(
    heading: string,
    index: number,
  ): string {
    const normalizedHeading =
      heading
        .normalize('NFD')
        .replace(
          /[\u0300-\u036f]/g,
          '',
        )
        .toLowerCase()
        .trim()
        .replace(
          /[^a-z0-9]+/g,
          '-',
        )
        .replace(
          /^-+|-+$/g,
          '',
        );

    return normalizedHeading
      ? `section-${normalizedHeading}-${index}`
      : `section-${index + 1}`;
  }

  private destroyReadingNavigation(): void {
    if (
      typeof window !== 'undefined'
    ) {
      window.removeEventListener(
        'scroll',
        this.updateReadingProgress,
      );

      if (
        this.markdownInitializationTimeout
      ) {
        window.clearTimeout(
          this.markdownInitializationTimeout,
        );
      }
    }

    this.headingObserver?.disconnect();
    this.resizeObserver?.disconnect();
  }

  private normalizeError(
    error: unknown,
  ): Error {
    if (error instanceof Error) {
      return error;
    }

    if (
      typeof error === 'object' &&
      error !== null
    ) {
      const httpError =
        error as {
          message?: unknown;
          status?: unknown;
          error?: {
            message?: unknown;
            error?: unknown;
          };
        };

      const nestedMessage =
        typeof httpError.error?.message === 'string'
          ? httpError.error.message
          : undefined;

      const directMessage =
        typeof httpError.message === 'string'
          ? httpError.message
          : undefined;

      const message =
        nestedMessage ??
        directMessage ??
        "Impossible de charger l'article.";

      return new Error(
        message,
        {
          cause: error,
        },
      );
    }

    if (
      typeof error === 'string'
    ) {
      return new Error(
        error,
      );
    }

    return new Error(
      "Impossible de charger l'article.",
      {
        cause: error,
      },
    );
  }

  toggleReadingPanel(): void {
    this.readingPanelOpened.update(
      (opened) => {
        const nextState = !opened;

        this.saveReadingPanelState(
          nextState,
        );

        return nextState;
      },
    );
  }

  openReadingPanel(): void {
    this.readingPanelOpened.set(true);
    this.saveReadingPanelState(true);
  }

  closeReadingPanel(): void {
    this.readingPanelOpened.set(false);
    this.saveReadingPanelState(false);
  }

  private getInitialReadingPanelState(): boolean {
    if (
      typeof window === 'undefined'
    ) {
      return true;
    }

    const storedState =
      window.localStorage.getItem(
        READING_PANEL_STORAGE_KEY,
      );

    if (storedState === null) {
      return true;
    }

    return storedState === 'true';
  }

  private saveReadingPanelState(
    opened: boolean,
  ): void {
    if (
      typeof window === 'undefined'
    ) {
      return;
    }

    window.localStorage.setItem(
      READING_PANEL_STORAGE_KEY,
      String(opened),
    );
  }

  private async savePostAsRead(): Promise<void> {
    if (
      this.readSaved() ||
      this.readSaving() ||
      !this.post.hasValue()
    ) {
      return;
    }

    const userId =
      this._sessionService.getUserIdSync();

    const postId =
      this.post.value().id;

    const progress =
      this.readingProgress();

    if (
      !userId ||
      !postId ||
      progress <= 0
    ) {
      return;
    }

    this.readSaving.set(true);

    try {
      await firstValueFrom(
        this._postService.updateReadingProgress(
          postId,
          progress,
          {
            context: SILENT_CONTEXT,
          },
        ),
      );

      this.lastSavedProgress.set(
        progress,
      );

      this.readSaved.set(
        progress >= 80,
      );
    } catch (error: unknown) {
      console.error(
        "Impossible d'enregistrer la lecture de l'article.",
        error,
      );
    } finally {
      this.readSaving.set(false);
    }
  }

  private saveCurrentReading(): void {
    if (
      !this.post.hasValue() ||
      this.readSaving()
    ) {
      return;
    }

    const userId =
      this._sessionService.getUserIdSync();

    const postId =
      this.post.value().id;

    const progress =
      this.readingProgress();

    if (
      !userId ||
      !postId ||
      progress <= 0 ||
      progress ===
        this.lastSavedProgress()
    ) {
      return;
    }

    this._postService.updateReadingProgress(
      postId,
      progress,
      {
        context: SILENT_CONTEXT,
      },
    ).subscribe({
      next: () => {
        this.lastSavedProgress.set(
          progress,
        );
      },
      error: (error: unknown) => {
        console.error(
          'Impossible de sauvegarder la progression de lecture.',
          error,
        );
      },
    });
  }

}