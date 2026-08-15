import { HttpContext } from "@angular/common/http";
import { Component, inject, resource, signal } from "@angular/core";
import { firstValueFrom } from "rxjs";
import { SUCCESS_MESSAGE } from "src/app/shared/helpers/toasts/models/toasts.config";
import { ToastService } from "src/app/shared/helpers/toasts/toaster.service";
import { PostService } from "../../posts/data-access/post.service";
import { Post } from "../../posts/model/post.model";
import { PaginatorComponent } from "src/app/shared/ui/paginator/paginator";
import { LoadingStateComponent } from "src/app/shared/ui/content/states/loading-state/loading-state";
import { PostCard } from "src/app/shared/ui/card/post-card/post-card";
import { EmptyStateComponent } from "src/app/shared/ui/content/states/empty-state/empty-state";
import { Router } from "@angular/router";
import { SessionService } from "src/app/shared/services/session.service";
import { PostReadingProgressService } from "src/app/shared/services/post-reading-progress.service";
import { UserPreferencesService } from "../../account/pages/profil/preferences.service";

type PostsParams = {
  page: number;
  limit: number;
};

@Component({
  selector: 'app-home-articles',
  templateUrl: './home-articles.html',
  styleUrls: ['./home-articles.scss'],
  imports: [PaginatorComponent, LoadingStateComponent, PostCard, EmptyStateComponent],
  providers: [PostReadingProgressService]
})
export class HomeArticlesComponent {
  public readonly _router = inject(Router);
  private readonly _toastService = inject(ToastService);
  private readonly _post = inject(PostService);
  private readonly _session = inject(SessionService)
  private readonly _preferences = inject(UserPreferencesService)

  private readonly reading =
    inject(PostReadingProgressService);

  page = signal(1);
  limit = signal(5);

  totalArticle = signal(0);
  sessionId = this._session.getUserIdSync()

  posts = resource<Post[], PostsParams>({
    params: () => ({
      page: this.page(),
      limit: this.limit(),
    }),

    loader: async ({ params }) => {
      try {
        const context = new HttpContext().set(SUCCESS_MESSAGE, false);
        const res = await firstValueFrom(

          this._post.getAllPublishedPost(params.page, params.limit, !this._preferences.hideReadPost(), { context })
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

        if (this._preferences.getPreference('hideReadPosts')) {
          const postsAll = res.data as Post[]
          
          const NotReadPostFilter: Post[] = []
          postsAll.forEach((post) => {
            this.reading.initialize(post.id ?? 0, Boolean(
          this._session
            .getUserIdSync(),
        ),)
            
            console.log(this.reading.completed())
            if (!this.reading.completed()) {
              NotReadPostFilter.push(post)
              this.reading.destroy()
            }
          })
          console.log(postsAll)
           return postsAll
        }



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

  updateLimit(currentPage: number): void {
    if (currentPage === this.limit()) return;

    this.limit.set(currentPage);
  }

  reload(): void {
    this.posts.reload();
  }
}