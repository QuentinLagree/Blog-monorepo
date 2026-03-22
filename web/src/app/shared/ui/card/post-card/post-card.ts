import { DatePipe } from "@angular/common";
import { HttpContext } from "@angular/common/http";
import { Component, inject, input, Input, InputSignal, OnInit, Signal } from "@angular/core";
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
export class PostCard implements OnInit {

    private _user: UserService = inject(UserService);
    private _router: Router = inject(Router)
    private _session: SessionService = inject(SessionService)
    
    post: InputSignal<Post> = input.required<Post>()
    author: User | undefined

    detailPath: string = "";

    authorLoading = false;

    sessionId = this._session.getUserIdSync();
    sessionRole = this._session.getUserRoleSync();
    
   async ngOnInit(): Promise<void> {
        try {

            const context = new HttpContext()
            .set(SUCCESS_MESSAGE, false);
            
            
            this.authorLoading = true;

            const response = await firstValueFrom(
            this._user.findUserWithId(this.post().authorId, { context })
            );

            this.author = response.data as User;
            shareReplay({
                bufferSize: 1, refCount: true
            })
        } catch (error) {
            console.error("Erreur lors de la récupération de l'utilisateur", error);
            this.author = undefined;
        } finally {
            this.authorLoading = false;
        }

        this.detailPath = this.getDetailPath()
    }

    getDetail () {
        const titlePath: string = this.post().title.toLocaleLowerCase().replaceAll(' ', '-')
        const id = this.post().id
        const detailPath = `/post/detail/${titlePath}?id=${id}`
        this._router.navigate([detailPath])
        
    }

    private getDetailPath () {
        const titlePath: string = this.post().title.toLocaleLowerCase().replaceAll(' ', '-')
        const id = this.post().id
        return `/post/detail/${titlePath}-${id}`
    }

    toEditForm () {
        this._router.navigate([`post/edit?=${this.post().id}`])
    }
}