import { DatePipe } from "@angular/common";
import { HttpContext } from "@angular/common/http";
import { Component, effect, inject, input, InputSignal, output, Signal, signal, WritableSignal } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { SessionService } from "src/app/shared/services/session.service";
import { User, UserService } from "src/app/shared/services/user.service";
import { SUCCESS_MESSAGE } from "src/app/shared/helpers/toasts/models/toasts.config";
import { firstValueFrom, timeout } from "rxjs";
import { BaseButtonComponent } from "../../form/buttons/base-button";
import { EditButtonComponent } from "../../form/buttons/button-edit/button-edit";
import { Post } from "src/app/features/posts/model/post.model";
import { Message } from "src/app/shared/types/message.type";
import { PostLikeStatus } from "src/app/features/posts/model/post-like-status.model";
import { PostService } from "src/app/features/posts/data-access/post.service";
import { DangerButtonComponent } from "../../form/buttons/button-danger/button-danger";
import { ContextMenuTriggerDirective } from "../../context-menu/context-menu.directive";
import { AdminActionsMenu } from "../../context-menu/config/context-menu-options";
import { ConfirmModalComponent } from "src/app/shared/helpers/modal/confirm-modal/confirm-modal";
import { ReadingStatus } from "src/app/features/posts/pages/post-detail/models/post-detail.types";
import { PostReadingProgressService } from "src/app/shared/services/post-reading-progress.service";

const SILENT_CONTEXT = new HttpContext().set(
  SUCCESS_MESSAGE,
  false,
);

@Component({
  selector: 'app-post-card',
  templateUrl: 'post-card.html',
  imports: [DatePipe, BaseButtonComponent, EditButtonComponent, RouterLink, DangerButtonComponent,
    ContextMenuTriggerDirective, ConfirmModalComponent],
    providers: [PostReadingProgressService]
})
export class PostCard {

  private _user: UserService = inject(UserService);
  private _router: Router = inject(Router)
  private _session: SessionService = inject(SessionService)

  
    private readonly reading =
      inject(PostReadingProgressService);

  readonly savedReadingProgress =
    this.reading.savedProgress;

  readonly hasStartedReading =
    this.reading.hasStarted;

  readonly isPostRead =
    this.reading.completed;

  post: InputSignal<Post> = input.required<Post>()
  author: WritableSignal<User | undefined> = signal(undefined);
  isDraft: InputSignal<boolean> = input(false)
  likesCount = signal(0);
  afterAction = output()

  detailPath: string = "";
  isUpdated: WritableSignal<boolean> = signal(false);

  isDeleted = signal(false)

  authorLoading = false;

  options = AdminActionsMenu

  sessionId = this._session.getUserIdSync();
  sessionRole = this._session.getUserRoleSync();

  isAdminAndNoAuthor: boolean = this.sessionId != this.author()?.id && this.sessionRole == 'admin'

  constructor(
    private readonly _postService: PostService,
  ) {
    effect(() => {
      const currentPost = this.post()
      const authorId = currentPost.authorId
      this.detailPath = this.getDetailPath()
      if (this.sessionId !== authorId) {
        this.reading.initialize(
        currentPost.id!,
        Boolean(
          this._session
            .getUserIdSync(),
        ),
      )
      }

      if (!authorId) {
        this.author.set(undefined);
        return;
      }

      void this.loadAuthor(authorId)

      void this.loadLikeStatus(this.post()?.id ?? 0)

      const published_at: number = new Date(this.post().published_at).getTime();

      if (new Date(this.post().updated_at ?? 0).getDay()) {
        const updated_at = new Date(this.post().updated_at ?? 0).getTime() ?? 0;
        this.isUpdated.set(updated_at >= published_at)
      }

    })
  }

  private async loadAuthor(authorId: number): Promise<void> {
    try {
      const context = new HttpContext()
        .set(SUCCESS_MESSAGE, false);

      this.authorLoading = true;

      const response = await firstValueFrom(
        this._user.findUserWithId(authorId, { context })
      );

      this.author.set(response.data as User);
    } catch (error) {
      console.error("Erreur lors de la récupération de l'utilisateur", error);
      this.author.set(undefined);
    } finally {
      this.authorLoading = false;
    }
  }

  formatFromContextMenu = (_data: unknown, option: string) => {
    switch (option) {
      case 'delete-post':
        console.log("OUVERTURE")
        this.openPostDeleteModal()
        break;

      case 'delete-author':
        this.openAuthorDeleteModal()
        break;
    }

    this.doAfterAction()
  }

  getSlugifyPath(): string {
    const slug = this.post().title
      .normalize('NFC')
      .toLocaleLowerCase('fr-FR')
      .trim()
      .replace(/['’`]+/gu, '-')
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');

    return `${slug}-${this.post().id}`;
  }

  getDetail() {
    const detailPath = `/post/detail/${this.getSlugifyPath()}`
    this._router.navigate([detailPath])

  }

  updatePost() {
    const id = this.post().id;
    const detailPath = `/post/edit/${id}`
    this._router.navigate([detailPath])

  }

  getDraftDetail() {
    const detailPath = `/draft/detail/${this.getSlugifyPath()}`
    this._router.navigate([detailPath])
  }

  private getDetailPath() {
    return `/post/detail/${this.getSlugifyPath()}`
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

      this.likesCount.set(response.data.likesCount);
    } catch (error) {
      this.likesCount.set(0);

      console.error(
        'Impossible de charger le statut du like.',
        error,
      );
    }
  }

  publishModalOpen = false;
  publishModalLoading = false;

  openPostDeleteModal(): void {
    this.publishModalOpen = true;
  }

  closePostDeleteModal(): void {
    this.publishModalOpen = false;
  }

  async deletePost(): Promise<void> {
    this.publishModalLoading = true;

    try {

      this._postService.deletePost(this.post().id ?? 0).subscribe({
        next: () => {
          this.isDeleted.set(true)
        }
      })
      this.publishModalOpen = false;

    } finally {
      this.publishModalLoading = false;
    }
  }

  authorModalOpen = false;
  authorModalLoading = false;

  openAuthorDeleteModal(): void {
    this.authorModalOpen = true;
  }

  closeAuthorDeleteModal(): void {
    this.authorModalOpen = false;
  }

  async deleteUser(): Promise<void> {
    this.authorModalLoading = true;

    try {

      setTimeout(() => {
        this.authorModalOpen = false;
      }, 3000)

    } finally {
      this.authorModalLoading = false;
    }
  }

  doAfterAction() {
    if (!this.afterAction) return;
    this.afterAction.emit()
  }
}