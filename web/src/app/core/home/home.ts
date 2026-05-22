import { HttpContext } from '@angular/common/http';
import { Component, computed, inject, resource, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseButtonComponent } from "@src/app/shared/ui/form/buttons/base-button";
import { PaginatorComponent } from "@src/app/shared/ui/paginator/paginator";
import { finalize, firstValueFrom } from 'rxjs';
import { Message } from '../models/message.model';
import { Post, PostService } from '../services/post.service';
import { SessionService } from '../services/session.service';
import { UserService } from '../services/user.service';
import { SUCCESS_MESSAGE } from '../toasts/models/toasts.config';

@Component({
    selector: 'app-home',
    templateUrl: './home.html',
    styleUrls: ['./home.scss'],
    imports: [BaseButtonComponent, PaginatorComponent]
})
export class HomeComponent {
    constructor() { }

    private _session: SessionService = inject(SessionService)
    private _user: UserService = inject(UserService)
    private _post: PostService = inject(PostService)
    public _router: Router = inject(Router)
    private _activatedRoute = inject(ActivatedRoute)

    private queryParamsMap = toSignal(this._activatedRoute.queryParamMap, {
        initialValue: this._activatedRoute.snapshot.queryParamMap    })
    page = computed(() =>this.queryParamsMap()?.get('page') ?? 1);

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