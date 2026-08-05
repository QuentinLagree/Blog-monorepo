import { HttpContext } from '@angular/common/http';
import {
  Injectable,
  inject,
  signal,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { SUCCESS_MESSAGE } from
  'src/app/shared/helpers/toasts/models/toasts.config';
import { SessionService } from
  'src/app/shared/services/session.service';
import {
  User,
  UserService,
} from
  'src/app/shared/services/user.service';
import { Message } from
  'src/app/shared/types/message.type';
import { PostService } from '../../../data-access/post.service';
import { PostLikeStatus } from '../../../model/post-like-status.model';
import { Post } from '../../../model/post.model';


const SILENT_CONTEXT =
  new HttpContext().set(
    SUCCESS_MESSAGE,
    false,
  );

@Injectable()
export class PostDetailSocialService {
  private readonly _postService =
    inject(PostService);

  private readonly _userService =
    inject(UserService);

  private readonly _session =
    inject(SessionService);

  readonly author =
    signal<User | undefined>(
      undefined,
    );

  readonly isAuthor =
    signal(false);

  readonly likesCount =
    signal(0);

  readonly hasLiked =
    signal(false);

  readonly likeLoading =
    signal(false);

  async initialize(
    post: Post,
  ): Promise<void> {
    this.reset();

    await this.loadAuthor(post);

    if (
      !this._session.getUserIdSync() ||
      !post.id
    ) {
      return;
    }

    await this.loadLikeStatus(
      post.id,
    );
  }

  async toggleLike(
    postId: number,
  ): Promise<void> {
    if (
      this.likeLoading() ||
      !this._session.getUserIdSync()
    ) {
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
      const response:
        Message<PostLikeStatus> =
        nextLiked
          ? await firstValueFrom(
            this._postService
              .likePost(
                postId,
                {
                  context:
                    SILENT_CONTEXT,
                },
              ),
          )
          : await firstValueFrom(
            this._postService
              .unlikePost(
                postId,
                {
                  context:
                    SILENT_CONTEXT,
                },
              ),
          );

      if (!response.data) {
        throw new Error(
          'Statut du like manquant.',
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

  reset(): void {
    this.author.set(undefined);
    this.isAuthor.set(false);
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

    try {
      const response: Message<User> =
        await firstValueFrom(
          this._userService
            .findUserWithId(
              post.authorId,
              {
                context:
                  SILENT_CONTEXT,
              },
            ),
        );

      if (!response.data) {
        return;
      }

      this.author.set(
        response.data,
      );

      this.isAuthor.set(
        response.data.id ===
        this._session
          .getUserIdSync(),
      );
    } catch (error: unknown) {
      console.error(
        "Impossible de charger l'auteur.",
        error,
      );
    }
  }

  private async loadLikeStatus(
      postId: number,
    ): Promise<void> {
        try {
        const response: Message<PostLikeStatus> =
          await firstValueFrom(
            this._postService.getStatusLike(postId, {
              context: SILENT_CONTEXT,
            }),
          ).finally(
            async () => {
              await firstValueFrom(
            this._postService.getPublicCountLike(postId, {
              context: SILENT_CONTEXT,
            }),
          )}
            
          )
  
        if (!response.data) {
          throw new Error(
            "La réponse de l'API ne contient pas le statut du like.",
          );
        }
  
        this.likesCount.set(response.data.likesCount);
      } catch (error) {
        this.likesCount.set(0);
  
        console.error(
          'Impossible de charger le statut du like.',
          error,
        );
      }
    }
}