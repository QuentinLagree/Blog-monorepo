import { Component, inject, OnInit, resource, signal } from '@angular/core';
import { DangerButtonComponent } from "@src/app/shared/ui/form/buttons/button-danger/button-danger";
import { BaseButtonComponent } from "@src/app/shared/ui/form/buttons/base-button";
import { SessionService } from '../services/session.service';
import { UserService } from '../services/user.service';
import { catchError, finalize, firstValueFrom, from, shareReplay } from 'rxjs';
import { Router } from '@angular/router';
import { Post, PostService } from '../services/post.service';
import { Message } from '../models/message.model';
import { HttpContext } from '@angular/common/http';
import { SUCCESS_MESSAGE } from '../toasts/models/toasts.config';
import { PostCard } from "@src/app/shared/ui/card/post-card/post-card";

@Component({
    selector: 'app-home',
    templateUrl: './home.html',
    styleUrls: ['./home.scss'],
    imports: [BaseButtonComponent, PostCard]
})
export class HomeComponent {
    constructor() { }

    private _session: SessionService = inject(SessionService)
    private _user: UserService = inject(UserService)
    private _post: PostService = inject(PostService)
    private _router: Router = inject(Router)

    loading = false;
    loadingPost = signal(true);

     posts = resource<Post[], Error>({
    loader: async () => {
        const context: HttpContext = new HttpContext().set(SUCCESS_MESSAGE, false)
      const res: Message<Post[]> = await firstValueFrom(this._post.getAllPublishedPost({context}));
      return res.data;
    },
  });

  reload() { this.posts.reload(); }
    

    logout() {
        this.loading = true;
        setTimeout(() => {
        this._user
        .logout()
        .pipe(
            finalize(() => {
                this.loading = false
            })
        ).subscribe(() => {
            this._session.clearSession();
            this._router.navigate([''])
        })
        }, 2000)
    }
}