import { Component, computed, inject, input, InputSignal, resource, signal } from "@angular/core";
import { User } from "src/app/shared/services/user.service";
import { BaseButtonComponent } from "src/app/shared/ui/form/buttons/base-button";
import { InputComponent } from "src/app/shared/ui/form/inputs/input/input";
import { PostCard } from "src/app/shared/ui/card/post-card/post-card";
import { PostService } from "src/app/features/posts/data-access/post.service";
import { FormControl } from "@angular/forms";
import { Post } from "src/app/features/posts/model/post.model";
import { Message } from "src/app/shared/types/message.type";
import { firstValueFrom } from "rxjs";
import { HttpContext } from "@angular/common/http";
import { SUCCESS_MESSAGE } from "src/app/shared/helpers/toasts/models/toasts.config";
import { DatePipe } from "@angular/common";

type PostStatusFilter =
    | 'all'
    | 'published'
    | 'draft';

@Component({
    selector: 'app-profil-posts',
    standalone: true,
    imports: [
        BaseButtonComponent,
        InputComponent,
        PostCard,
        DatePipe
    ],
    templateUrl: './profil-posts.html',
    styleUrls: ['./profil-posts.scss', '../profil-collapse.scss']
})
export class ProfilPostsComponent {

    readonly sessionId: InputSignal<number> = input.required()

    private readonly _post =
        inject(PostService);

    readonly postStatusFilter =
        signal<PostStatusFilter>('all');

    readonly posts = resource<Post[], Error>({
        loader: async (): Promise<Post[]> => {
            if (!this.sessionId) {
                return [];
            }

            const context =
                new HttpContext().set(SUCCESS_MESSAGE, false)

            const response: Message<Post[]> =
                await firstValueFrom(
                    this._post.getAllPostOfUser(
                        this.sessionId(),
                        {
                            context,
                        },
                    ),
                );

            return response.data;
        },
    });


    readonly userPosts = computed(() =>
        this.posts.value() ?? [],
    );


    readonly postSearch =
        signal('');

    readonly filteredPosts = computed(() => {
        const status =
            this.postStatusFilter();

        const search =
            this.postSearch()
                .trim()
                .toLocaleLowerCase('fr');

        return this.userPosts()
            .filter((post) => {
                switch (status) {
                    case 'published':
                        return Boolean(post.published_at);

                    case 'draft':
                        return !post.published_at;

                    default:
                        return true;
                }
            })
            .filter((post) => {
                if (!search) {
                    return true;
                }

                const searchableContent = [
                    post.title,
                    post.description,
                ]
                    .filter(Boolean)
                    .join(' ')
                    .toLocaleLowerCase('fr');

                return searchableContent.includes(search);
            })
            .sort((firstPost, secondPost) => {
                const firstDate =
                    new Date(firstPost.created_at).getTime();

                const secondDate =
                    new Date(secondPost.created_at).getTime();

                return secondDate - firstDate;
            });
    });
    readonly emptyPostsTitle = computed(() => {
        if (this.postSearch().trim()) {
            return 'Aucun résultat';
        }

        switch (this.postStatusFilter()) {
            case 'published':
                return 'Aucun article publié';

            case 'draft':
                return 'Aucun brouillon';

            default:
                return 'Aucun article';
        }
    });

    readonly emptyPostsDescription = computed(() => {
        const search =
            this.postSearch().trim();

        if (search) {
            return `Aucun article ne correspond à la recherche « ${search} ».`;
        }

        switch (this.postStatusFilter()) {
            case 'published':
                return 'Tu n’as encore publié aucun article.';

            case 'draft':
                return 'Tu n’as aucun article en cours de rédaction.';

            default:
                return 'Tu n’as encore créé aucun article.';
        }
    });

    showPosts = false;
    searchPost = new FormControl(this.postSearch())

    reloadPosts(): void {
        console.log("UPDATED")
        this.posts.reload();
    }

    updatePostSearch(
        event: Event,
    ): void {
        const input =
            event.target as HTMLInputElement | null;

        this.postSearch.set(
            input?.value ?? '',
        );
    }

    clearPostSearch(): void {
        this.postSearch.set('');
    }

    setPostStatusFilter(
        status: PostStatusFilter,
    ): void {
        this.postStatusFilter.set(status);
    }

    resetPostFilters(): void {
        this.postStatusFilter.set('all');
        this.postSearch.set('');
    }

    readonly postCounts = computed(() => {
        const posts =
            this.userPosts();

        return {
            all: posts.length,

            published:
                posts.filter(
                    (post) => Boolean(post.published_at),
                ).length,

            draft:
                posts.filter(
                    (post) => !post.published_at,
                ).length,
        };
    });
}