import { HttpContext } from '@angular/common/http';
import { Component, computed, inject, resource, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseButtonComponent } from "@src/app/shared/ui/form/buttons/base-button";
import { PaginatorComponent } from "@src/app/shared/ui/paginator/paginator";
import { firstValueFrom } from 'rxjs';
import { Message } from '../models/message.model';
import { Post, PostService } from '../services/post.service';
import { SUCCESS_MESSAGE } from '../toasts/models/toasts.config';
import { PostCard } from "src/app/shared/ui/card/post-card/post-card";
import { ToastService } from '../toasts/toaster.service';

type PostsParams = {
  page: number;
  limit: number;
};

@Component({
    selector: 'app-home',
    templateUrl: './home.html',
    styleUrls: ['./home.scss'],
    imports: [BaseButtonComponent, PaginatorComponent, PostCard]
})


export class HomeComponent {
    constructor() { }

    private _post: PostService = inject(PostService)
    public _router: Router = inject(Router)
    private _activatedRoute = inject(ActivatedRoute)
    private _toastService = inject(ToastService)

    private queryParamsMap = toSignal(this._activatedRoute.queryParamMap, {
        initialValue: this._activatedRoute.snapshot.queryParamMap    })
    page = computed(() =>this.queryParamsMap()?.get('page') ?? 1);
    limit = computed(() =>this.queryParamsMap()?.get('limit') ?? 2);

    totalArticle = signal(0);

    

    posts = resource<Post[], PostsParams>({
  params: () => ({
    page: +this.page(),
    limit: +this.limit(),
  }),

  loader: async ({ params }) => {
    console.log('reload articles');

    const context: HttpContext = new HttpContext()
      .set(SUCCESS_MESSAGE, false);

    const res: Message<Post[]> = await firstValueFrom(
      this._post.getAllPublishedPost(params.page, params.limit, { context })
    );

    if (res.data == null) {
      this._toastService.error("Erreur lors de la récupération des articles, mauvaise page.", {
      duration: 5000
    });
    return [];
  }
  if (res.meta) this.totalArticle.set(res.meta.totalArticle);

    return res.data;
  },
});

  updatePage(currentPage: number) {
    this.reload()
    this._router.navigate(['/home'], {
      queryParams: { page: currentPage, limit: this.limit() }
    });
  }

  reload() { this.posts.reload(); }

  
    

    
}