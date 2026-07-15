import { DatePipe } from '@angular/common';
import { HttpContext } from '@angular/common/http';
import {
  AfterViewInit,
  Component,
  OnInit,
  resource,
  signal,
  WritableSignal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MarkdownComponent } from 'ngx-markdown';
import { firstValueFrom } from 'rxjs';

import { ERROR_MESSAGE, SUCCESS_MESSAGE } from 'src/app/shared/helpers/toasts/models/toasts.config';
import { SessionService } from 'src/app/shared/services/session.service';
import {
  User,
  UserService,
} from 'src/app/shared/services/user.service';
import { Message } from 'src/app/shared/types/message.type';
import { BaseButtonComponent } from 'src/app/shared/ui/form/buttons/base-button';

import { PostService } from '../../data-access/post.service';
import { Post } from '../../model/post.model';
import { PostLikeStatus } from '../../model/post-like-status.model';

const SILENT_CONTEXT = new HttpContext().set(
  SUCCESS_MESSAGE,
  false,
);

@Component({
  selector: 'app-post-detail',
  templateUrl: './post-detail.html',
  styleUrls: ['./post-detail.scss'],
  imports: [
    MarkdownComponent,
    DatePipe,
    BaseButtonComponent,
  ],
  standalone: true,
})
export class PostDetailComponent implements OnInit {
  slugTitle = '';

  author: WritableSignal<User | undefined> =
    signal<User | undefined>(undefined);

  likesCount = signal(0);
  hasLiked = signal(false);
  likeLoading = signal(false);
  isAuthor = signal(false)

  constructor(
    private readonly _activatedRoute: ActivatedRoute,
    private readonly _router: Router,
    private readonly _userService: UserService,
    private readonly _postService: PostService,
    private readonly _sessionService: SessionService,
  ) {}

  ngOnInit(): void {
    this.slugTitle =
      this._activatedRoute.snapshot.params['title'] ?? '';
  }

  post = resource<Post, Error>({
    loader: async (): Promise<Post> => {
      this.resetLikeState();
      this.author.set(undefined);

      const title =
        this._activatedRoute.snapshot.params['title'] ?? '';

      const slug = title
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

      const postResponse: Message<Post> =
        await firstValueFrom(
          this._postService.getPublishedDetail(slug, {
            context: SILENT_CONTEXT,
          }),
        );

      const post = postResponse.data;
      const sessionId =
        this._sessionService.getUserIdSync();

      if (
        post.published_at == null &&
        sessionId !== post.authorId
      ) {
        await this._router.navigate(['/home']);

        throw new Error(
          "Vous n'êtes pas autorisé à consulter cet article.",
        );
      }

      await this.loadAuthor(post);

      if (post.id) {
        await this.loadLikeStatus(post.id);
      }

      return post;
    },
  });


  private resetLikeState(): void {
    this.likesCount.set(0);
    this.hasLiked.set(false);
    this.likeLoading.set(false);
  }

  private async loadAuthor(post: Post): Promise<void> {
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
      this.isAuthor.set(userResponse.data.id === this._sessionService.getUserIdSync())


    this.author.set(userResponse.data);
    
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
      );

    if (!response.data) {
      throw new Error(
        "La réponse de l'API ne contient pas le statut du like.",
      );
    }

    this.hasLiked.set(response.data.liked);
    this.likesCount.set(response.data.likesCount);
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

  const postId = this.post.value()?.id;

  if (!postId) {
    return;
  }

  const previousLiked = this.hasLiked();
  const previousCount = this.likesCount();
  const nextLiked = !previousLiked;

  this.likeLoading.set(true);

  this.hasLiked.set(nextLiked);
  this.likesCount.set(
    nextLiked
      ? previousCount + 1
      : Math.max(0, previousCount - 1),
  );

  try {
    const response: Message<PostLikeStatus> =
      nextLiked
        ? await firstValueFrom(
            this._postService.likePost(postId, {
              context: SILENT_CONTEXT,
            }),
          )
        : await firstValueFrom(
            this._postService.unlikePost(postId, {
              context: SILENT_CONTEXT,
            }),
          );

    if (!response.data) {
      throw new Error(
        "L'API n'a pas retourné le nouveau statut du like.",
      );
    }

    // Synchronisation avec la vraie valeur en base
    this.hasLiked.set(response.data.liked);
    this.likesCount.set(response.data.likesCount);
  } catch (error) {
    this.hasLiked.set(previousLiked);
    this.likesCount.set(previousCount);

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
      .filter(Boolean).length;

    return Math.max(
      1,
      Math.ceil(words / 200),
    );
  }

  contribute(): void {
    throw new Error('Method not implemented.');
  }

  sharePost(): void {
    throw new Error('Method not implemented.');
  }

  goBack(): void {
    void this._router.navigate(['']);
  }
}