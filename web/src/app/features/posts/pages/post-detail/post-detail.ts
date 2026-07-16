import { DatePipe } from '@angular/common';
import { HttpContext } from '@angular/common/http';
import {
  Component,
  OnInit,
  resource,
  signal,
  WritableSignal,
} from '@angular/core';
import {
  ActivatedRoute,
  Router,
} from '@angular/router';
import { MarkdownComponent } from 'ngx-markdown';
import { firstValueFrom } from 'rxjs';

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
import { environment } from 'src/environments/environment';

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
  styleUrls: ['./post-detail.scss'],
})
export class PostDetailComponent implements OnInit {
  slugTitle = '';

  readonly author: WritableSignal<User | undefined> =
    signal(undefined);

  readonly likesCount = signal(0);
  readonly hasLiked = signal(false);
  readonly likeLoading = signal(false);
  readonly isAuthor = signal(false);

  /**
   * Cette préférence est déjà chargée globalement
   * dans UserPreferencesService.
   *
   * Il ne faut pas faire de .set() dessus ici.
   */

  readonly showReadingTime =
    this._preferences.showReadingTime;

  readonly post = resource<Post, unknown>({
    loader: async (): Promise<Post> => {
      try {
        this.resetLikeState();
        this.author.set(undefined);

        const title =
          this._activatedRoute.snapshot.params['title'] ?? '';

        const slug = title
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');

        if (!slug) {
          throw new Error(
            "Le titre de l'article est manquant.",
          );
        }

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

        const post = postResponse.data;

        const sessionId =
          this._sessionService.getUserIdSync();

        if (
          post.published_at == null &&
          sessionId !== post.authorId
        ) {
          await this._router.navigate([
            '/home',
          ]);

          throw new Error(
            "Vous n'êtes pas autorisé à consulter cet article.",
          );
        }

        await this.loadAuthor(post);

        if (post.id) {
          await this.loadLikeStatus(post.id);
        }

        return post;
      } catch (error: unknown) {
        console.error(
          "Erreur lors du chargement de l'article :",
          error,
        );

        if (error instanceof Error) {
          throw error;
        }

        if (
          typeof error === 'object' &&
          error !== null
        ) {
          const httpError = error as {
            message?: string;
            error?: {
              message?: string;
            };
          };

          throw new Error(
            httpError.error?.message ??
            httpError.message ??
            "Impossible de charger l'article.",
            {
              cause: error,
            },
          );
        }

        throw new Error(
          "Impossible de charger l'article.",
          {
            cause: error,
          },
        );
      }
    },
  });
  constructor(
    private readonly _activatedRoute: ActivatedRoute,
    private readonly _router: Router,
    private readonly _userService: UserService,
    private readonly _postService: PostService,
    private readonly _sessionService: SessionService,
    private readonly _preferences: UserPreferencesService,
  ) { }

  ngOnInit(): void {
    this.slugTitle =
      this._activatedRoute.snapshot.params['title'] ?? '';
  }

  private resetLikeState(): void {
    this.likesCount.set(0);
    this.hasLiked.set(false);
    this.likeLoading.set(false);
  }

  private async loadAuthor(
    post: Post,
  ): Promise<void> {
    if (!post.authorId) {
      return;
    }

    const userResponse: Message<User> =
      await firstValueFrom(
        this._userService.findUserWithId(
          post.authorId,
          {
            context: SILENT_CONTEXT,
          },
        ),
      );

    const sessionId =
      this._sessionService.getUserIdSync();

    this.isAuthor.set(
      userResponse.data.id === sessionId,
    );

    this.author.set(
      userResponse.data,
    );
  }

  private async loadLikeStatus(
    postId: number,
  ): Promise<void> {
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

      if (!response.data) {
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
    } catch (error) {
      this.hasLiked.set(false);
      this.likesCount.set(0);

      console.error(
        'Impossible de charger le statut du like.',
        error,
      );
    }
  }

  async toggleLike(): Promise<void> {
    if (this.likeLoading()) {
      return;
    }

    const postId =
      this.post.value()?.id;

    if (!postId) {
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

      if (!response.data) {
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
    } catch (error) {
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
      this.post.value()?.content ?? '';

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
    throw new Error(
      'Method not implemented.',
    );
  }

  goBack(): void {
    void this._router.navigate([
      '',
    ]);
  }
}