import { DatePipe } from '@angular/common';
import { HttpContext } from '@angular/common/http';
import {
  Component,
  inject,
  resource,
  signal,
  WritableSignal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  ActivatedRoute,
  Router,
} from '@angular/router';
import { MarkdownComponent } from 'ngx-markdown';
import {
  firstValueFrom,
  map,
} from 'rxjs';

import { UserPreferencesService } from 'src/app/features/account/pages/profil/preferences.service';
import { SUCCESS_MESSAGE } from 'src/app/shared/helpers/toasts/models/toasts.config';
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

@Component({
  selector: 'app-post-detail',
  standalone: true,
  imports: [
    MarkdownComponent,
    DatePipe,
    BaseButtonComponent,
  ],
  templateUrl: './post-detail.html',
  styleUrls: ['./post-detail.scss', '../../../../core/layouts/landing/landing.scss'],
})
export class PostDetailComponent {
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

  readonly author: WritableSignal<User | undefined> =
    signal(undefined);

  readonly likesCount = signal(0);
  readonly hasLiked = signal(false);
  readonly likeLoading = signal(false);
  readonly isAuthor = signal(false);

  readonly showReadingTime =
    this._preferences.showReadingTime;

  /**
   * Le slug est maintenant réactif.
   *
   * Il sera mis à jour lors d'une navigation Angular,
   * même si le composant est réutilisé.
   */
  private readonly routeSlug = toSignal(
    this._activatedRoute.paramMap.pipe(
      map((params) => {
        return params.get('title') ?? '';
      }),
    ),
    {
      initialValue: '',
    },
  );
  readonly slugTitle = this.routeSlug;

  readonly post = resource<Post, string>({
    params: () => {
      const slug =
        this.routeSlug().trim();

      return slug || '';
    },

    loader: async ({
      params: slug,
    }): Promise<Post> => {
      try {
        this.resetPostState();

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

        const post =
          postResponse.data;

        this.checkPostAccess(post);

        await this.loadAuthor(post);

        if (post.id) {
          await this.loadLikeStatus(
            post.id,
          );
        }

        return post;
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

  private resetPostState(): void {
    this.author.set(undefined);
    this.isAuthor.set(false);

    this.likesCount.set(0);
    this.hasLiked.set(false);
    this.likeLoading.set(false);
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

  readingTime(
    content?: string | null,
  ): number {
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

  contribute(): void {
    throw new Error(
      'Method not implemented.',
    );
  }

  sharePost(): void {
    if (!this.post.hasValue()) {
      return;
    }

    const url =
      window.location.href;

    if (navigator.share) {
      void navigator.share({
        title: this.post.value().title,
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
      const httpError = error as {
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

    if (typeof error === 'string') {
      return new Error(error);
    }

    return new Error(
      "Impossible de charger l'article.",
      {
        cause: error,
      },
    );
  }
}