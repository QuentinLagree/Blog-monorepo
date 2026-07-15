import { HttpContext } from '@angular/common/http';
import { Component, computed, inject, resource, signal } from '@angular/core';
import { Router } from '@angular/router';
import { BaseButtonComponent } from '@src/app/shared/ui/form/buttons/base-button';
import { PaginatorComponent } from '@src/app/shared/ui/paginator/paginator';
import { firstValueFrom } from 'rxjs';
import { SUCCESS_MESSAGE } from 'src/app/shared/helpers/toasts/models/toasts.config';
import { ToastService } from 'src/app/shared/helpers/toasts/toaster.service';
import { PostCard } from 'src/app/shared/ui/card/post-card/post-card';
import { PostService } from '../posts/data-access/post.service';
import { Post } from '../posts/model/post.model';

type PostsParams = {
  page: number;
  limit: number;
};

@Component({
  selector: 'app-home',
  templateUrl: './home.html',
  styleUrls: ['./home.scss'],
  imports: [BaseButtonComponent, PaginatorComponent, PostCard],
})
export class HomeComponent {
  private readonly _post = inject(PostService);
  public readonly _router = inject(Router);
  private readonly _toastService = inject(ToastService);

  page = signal(1);
  limit = signal(5);

  totalArticle = signal(0);

  posts = resource<Post[], PostsParams>({
    params: () => ({
      page: this.page(),
      limit: this.limit(),
    }),

    loader: async ({ params }) => {
      try {
        const context = new HttpContext().set(SUCCESS_MESSAGE, false);
        const res = await firstValueFrom(
          
          this._post.getAllPublishedPost(params.page, params.limit, { context })
        );


        if (!res.data) {
          this._toastService.error(
            'La liste est vide ou une erreur est survenue lors de la récupération des articles.',
            { duration: 5000 }
          );

          this.totalArticle.set(0);
          return [];
        }

        this.totalArticle.set(res.meta?.totalArticle ?? 0);

        return res.data;
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Erreur lors de la récupération des articles.';

        this._toastService.error(message, { duration: 5000 });

        return [];
      }
    },
  });

  updatePage(currentPage: number): void {
    if (currentPage === this.page()) return;

    this.page.set(currentPage);
  }

  reload(): void {
    this.posts.reload();
  }
}