import { DatePipe } from "@angular/common";
import { HttpContext } from "@angular/common/http";
import { Component, effect, inject, input, InputSignal, signal, WritableSignal } from "@angular/core";
import { Router } from "@angular/router";
import { SessionService } from "src/app/shared/services/session.service";
import { User, UserService } from "src/app/shared/services/user.service";
import { SUCCESS_MESSAGE } from "src/app/shared/helpers/toasts/models/toasts.config";
import { firstValueFrom } from "rxjs";
import { BaseButtonComponent } from "../../form/buttons/base-button";
import { EditButtonComponent } from "../../form/buttons/button-edit/button-edit";
import { Post } from "src/app/features/posts/model/post.model";
import { Message } from "src/app/shared/types/message.type";
import { PostLikeStatus } from "src/app/features/posts/model/post-like-status.model";
import { PostService } from "src/app/features/posts/data-access/post.service";

const SILENT_CONTEXT = new HttpContext().set(
  SUCCESS_MESSAGE,
  false,
);

@Component({
    selector: 'app-post-card',
    templateUrl: 'post-card.html',
    styleUrls: ['./post-card.scss'],
    imports: [DatePipe, BaseButtonComponent, EditButtonComponent]
})
export class PostCard {

    private _user: UserService = inject(UserService);
    private _router: Router = inject(Router)
    private _session: SessionService = inject(SessionService)
    
    post: InputSignal<Post> = input.required<Post>()
    author: WritableSignal<User | undefined> = signal(undefined);
    isDraft: InputSignal<boolean> = input(false)
    likesCount = signal(0);

    detailPath: string = "";

    authorLoading = false;

    sessionId = this._session.getUserIdSync();
    sessionRole = this._session.getUserRoleSync();

    isAdminAndNoAuthor: boolean = this.sessionId != this.author()?.id && this.sessionRole == 'admin'
    
   constructor (
    private readonly _postService: PostService,
   ) {
    effect(() => {
        const currentPost = this.post()
        const authorId = currentPost.authorId
        this.detailPath = this.getDetailPath()

        if (!authorId) {
            this.author.set(undefined);
            return;
        }

        void this.loadAuthor(authorId)

        void this.loadLikeStatus(this.post()?.id ?? 0)
        
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

    getSlugifyPath (noID: boolean = false): string {
       return (`${this.post().title.toLocaleLowerCase().replaceAll(/[*+~.()'"!:@]/g, "")} ${noID == true ? " " : this.post().id}`).replaceAll("  ", " ").replaceAll(' ', '-')
    }

    getDetail () {
        const id = this.post().id;
        const detailPath = `/post/detail/${this.getSlugifyPath(true)}?id=${id}`
        this._router.navigate([detailPath])
        
    }

    updatePost () {
        const id = this.post().id;
        const detailPath = `/post/edit/${id}`
        console.log("UPDATED")
        this._router.navigate([detailPath])
        
    }

    getDraftDetail () {
      const id = this.post().id;
        const detailPath = `/draft/detail/${this.getSlugifyPath(true)}?id=${id}`
        this._router.navigate([detailPath])
    }

    private getDetailPath () {
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
}