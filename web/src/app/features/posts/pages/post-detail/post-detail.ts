import { HttpContext } from '@angular/common/http';
import {
  Component,
  DestroyRef,
  ViewEncapsulation,
  WritableSignal,
  effect,
  inject,
  resource,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  ActivatedRoute,
  Router,
} from '@angular/router';
import {
  distinctUntilChanged,
  firstValueFrom,
  map,
} from 'rxjs';

import { UserPreferencesService } from
  'src/app/features/account/pages/profil/preferences.service';
import { SUCCESS_MESSAGE } from
  'src/app/shared/helpers/toasts/models/toasts.config';
import { BreadcrumbService } from
  'src/app/shared/services/breadcrumb.service';
import { SessionService } from
  'src/app/shared/services/session.service';
import { Message } from
  'src/app/shared/types/message.type';
import { EmptyStateComponent } from
  'src/app/shared/ui/content/states/empty-state/empty-state';
import { PageLandingLoadingComposent } from
  'src/app/shared/ui/content/page-landing-loading/page-landing-loading';
import { BaseButtonComponent } from
  'src/app/shared/ui/form/buttons/base-button';

import { PostService } from
  '../../data-access/post.service';
import { Post } from
  '../../model/post.model';
import { PostDetailSocialService } from
  './services/post-detail-social.service';
import { PostReadingNavigationService } from
  './services/post-reading-navigation.service';
import { PostReadingPanelService } from
  './services/post-reading-panel.service';
import { PostReadingProgressService } from
  '../../../../shared/services/post-reading-progress.service';
import { PostDetailHeaderComponent } from './post-detail-header/post-detail-header';
import { PostDetailContentComponent } from './post-detail-content/post-detail-content';
import { ForgetPasswordComponent } from "src/app/core/auth/pages/forget-password/forget-password";
import { LoginModalComponent } from "src/app/shared/helpers/modal/login-modal/login-modal";

const SILENT_CONTEXT =
  new HttpContext().set(
    SUCCESS_MESSAGE,
    false,
  );

@Component({
  selector: 'app-post-detail',
  standalone: true,
  providers: [
    PostDetailSocialService,
    PostReadingNavigationService,
    PostReadingPanelService,
    PostReadingProgressService,
  ],
  imports: [
    BaseButtonComponent,
    EmptyStateComponent,
    PageLandingLoadingComposent,
    PostDetailHeaderComponent,
    PostDetailContentComponent,
    LoginModalComponent
],
  templateUrl: './post-detail.html',
  styleUrls: [
    './post-detail.scss',
    '../../../../core/layouts/landing/landing.scss',
  ],
  encapsulation:
    ViewEncapsulation.None,
})
export class PostDetailComponent {
  private readonly _route =
    inject(ActivatedRoute);

  readonly _router =
    inject(Router);

  private readonly _postService =
    inject(PostService);

  readonly _session =
    inject(SessionService);

  private readonly _breadcrumb =
    inject(BreadcrumbService);

  private readonly _destroyRef =
    inject(DestroyRef);

  private readonly social =
    inject(PostDetailSocialService);

  private readonly navigation =
    inject(PostReadingNavigationService);

  private readonly readingPanel =
    inject(PostReadingPanelService);

  private readonly reading =
    inject(PostReadingProgressService);

  private initializedPostId:
    number | null = null;

  readonly author =
    this.social.author;

  readonly isAuthor =
    this.social.isAuthor;

  readonly likesCount =
    this.social.likesCount;

  readonly hasLiked =
    this.social.hasLiked;

  readonly likeLoading =
    this.social.likeLoading;

  readonly tableOfContents =
    this.navigation.tableOfContents;

  readonly activeHeadingIndex =
    this.navigation.activeHeadingIndex;

  readonly activeHeading =
    this.navigation.activeHeading;

  readonly readingProgress =
    this.navigation.progress;

  readonly mobileSummaryOpened =
    this.navigation.mobileSummaryOpened;

  readonly readingPanelOpened =
    this.readingPanel.opened;

  readonly savedReadingProgress =
    this.reading.savedProgress;

  readonly hasStartedReading =
    this.reading.hasStarted;

  readonly isPostRead =
    this.reading.completed;

  private readonly routeSlug =
    toSignal(
      this._route.paramMap.pipe(
        map(
          (params) =>
            params
              .get('title')
              ?.trim() ||
            undefined,
        ),
        distinctUntilChanged(),
      ),
      {
        initialValue:
          this._route.snapshot.paramMap
            .get('title')
            ?.trim() ||
          undefined,
      },
    );

  readonly post =
    resource<
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

        const response: Message<Post> =
          await firstValueFrom(
            this._postService
              .getPublishedDetail(
                slug,
                {
                  context:
                    SILENT_CONTEXT,
                },
              ),
          );

        if (!response.data) {
          throw new Error(
            "L'article demandé est introuvable.",
          );
        }

        this.checkAccess(
          response.data,
        );

        this._breadcrumb.setWithHome([
          {
            label: 'Articles',
            url: '/home',
          },
          {
            label:
              response.data.title,
          },
        ]);

        return response.data;
      },
    });

    showModal: WritableSignal<boolean> = signal(false)

  constructor() {
    this.showModal.set(false)
    effect(() => {
      if (!this.post.hasValue()) {
        return;
      }

      const currentPost =
        this.post.value();

      if (
        !currentPost.id ||
        this.initializedPostId ===
          currentPost.id
      ) {
        return;
      }

      this.initializedPostId =
        currentPost.id;

      void this.initializePost(
        currentPost,
      );
    });

    effect(() => {
      this.showModal.set(false)
      this.reading.update(
        this.navigation.progress(),
      );
      if (this.readingProgress() >= 35 && !this._session.getUserIdSync()) {
        this.showModal.set(true)
      }
    });

    this._destroyRef.onDestroy(
      () => {
        this.reading.destroy();
        this.navigation.destroy();
      },
    );
  }

  initializeReadingNavigation(
    content: HTMLElement,
  ): void {
    this.navigation.initialize(
      content,
    );
  }

  async toggleLike(): Promise<void> {
    if (!this.post.hasValue()) {
      return;
    }

    const postId =
      this.post.value().id;

    if (postId) {
      await this.social.toggleLike(
        postId,
      );
    }
  }

  readingTime(): number {
    if (!this.post.hasValue()) {
      return 1;
    }

    const words =
      this.post
        .value()
        .content
        ?.trim()
        .split(/\s+/)
        .filter(Boolean)
        .length ?? 0;

    return Math.max(
      1,
      Math.ceil(words / 200),
    );
  }

  scrollToHeading(
    headingId: string,
  ): void {
    this.navigation.scrollTo(
      headingId,
    );
  }

  toggleMobileSummary(): void {
    this.navigation
      .toggleMobileSummary();
  }

  closeMobileSummary(): void {
    this.navigation
      .closeMobileSummary();
  }

  openReadingPanel(): void {
    this.readingPanel.open();
  }

  closeReadingPanel(): void {
    this.readingPanel.close();
  }

  contribute(): void {
    if (!this.post.hasValue()) {
      return;
    }

    const currentPost =
      this.post.value();

    void this._router.navigate(
      [
        '/posts',
        currentPost.id,
        'contribute',
      ],
      {
        queryParams: {
          title:
            currentPost.title,
        },
      },
    );
  }

  sharePost(): void {
    if (!this.post.hasValue()) {
      return;
    }

    const currentPost =
      this.post.value();

    const url =
      window.location.href;

    if (navigator.share) {
      void navigator.share({
        title:
          currentPost.title,
        text:
          currentPost.description,
        url,
      });

      return;
    }

    void navigator.clipboard
      .writeText(url);
  }

  goBack(): void {
    void this._router.navigate([
      '/home',
    ]);
  }

  private async initializePost(
    currentPost: Post,
  ): Promise<void> {
    await Promise.allSettled([
      this.social.initialize(
        currentPost,
      ),

      this.reading.initialize(
        currentPost.id!,
        Boolean(
          this._session
            .getUserIdSync(),
        ),
      ),
    ]);
  }

  private checkAccess(
    currentPost: Post,
  ): void {
    const isUnpublished =
      currentPost.published_at ==
      null;

    const isAuthor =
      currentPost.authorId ===
      this._session
        .getUserIdSync();

    if (
      isUnpublished &&
      !isAuthor
    ) {
      void this._router.navigate([
        '/home',
      ]);

      throw new Error(
        "Vous n'êtes pas autorisé à consulter cet article.",
      );
    }
  }
}