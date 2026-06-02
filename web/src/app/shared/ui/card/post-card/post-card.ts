import { DatePipe } from "@angular/common";
import { HttpContext } from "@angular/common/http";
import { AfterViewInit, Component, effect, inject, input, Input, InputSignal, OnInit, signal, Signal, WritableSignal } from "@angular/core";
import { Post } from "@src/app/core/services/post.service";
import { User, UserService } from "@src/app/core/services/user.service";
import { SUCCESS_MESSAGE } from "@src/app/core/toasts/models/toasts.config";
import { finalize, firstValueFrom, shareReplay } from "rxjs";
import { BaseButtonComponent } from "../../form/buttons/base-button";
import { Router } from "@angular/router";
import { EditButtonComponent } from "../../form/buttons/button-edit/button-edit";
import { SessionService } from "@src/app/core/services/session.service";

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

    detailPath: string = "";

    authorLoading = false;

    sessionId = this._session.getUserIdSync();
    sessionRole = this._session.getUserRoleSync();

    isAdminAndNoAuthor: boolean = this.sessionId != this.author()?.id && this.sessionRole == 'admin'
    
   constructor () {
    effect(() => {
        const currentPost = this.post()
        const authorId = currentPost.authorId
        this.detailPath = this.getDetailPath()

        if (!authorId) {
            this.author.set(undefined);
            return;
        }

        void this.loadAuthor(authorId)
        
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

       /**
        * Titre sympatique !
        * titre sympatique !
        * titre sympatique
        * titre sympatique 2
        * titre-sympatique-2
        * 
        * titre sympatique
        * titre sympatique
        */
    }

    getDetail () {
        const id = this.post().id;
        const detailPath = `/post/detail/${this.getSlugifyPath(true)}?id=${id}`
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

    toEditForm () {
      console.log("Salut je suis edit")
        this._router.navigate([`post/edit?=${this.post().id}`])
    }
}