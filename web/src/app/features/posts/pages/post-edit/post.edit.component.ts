import { HttpContext } from "@angular/common/http";
import { Component, inject, OnInit, resource } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { firstValueFrom } from "rxjs";
import { PostFormComponent } from "../post-form/post-form";
import { SUCCESS_MESSAGE } from "src/app/shared/helpers/toasts/models/toasts.config";
import { ToastService } from "src/app/shared/helpers/toasts/toaster.service";
import { Message } from "src/app/shared/types/message.type";
import { PostService } from "../../data-access/post.service";
import { Post } from "../../model/post.model";

@Component({
    selector: 'app-edit-post',
    template: `
    
    @if (this.post.value()){
        <app-form-post [post]="post.value() ?? undefined"></app-form-post>
    }
  `,
    imports: [
        PostFormComponent
    ],
})

export class PostEditComponent implements OnInit {

    constructor() { }

    id: number = 0;

    private _post: PostService = inject(PostService)
    private _toastService: ToastService = inject(ToastService)
    private _activatedRoute: ActivatedRoute = inject(ActivatedRoute);

    ngOnInit() {
        this._activatedRoute.params.subscribe(params => { this.id = params['id']; })
    }
    post = resource<Post | null, { id: number }>({
        params: () => ({
            id: +this.id,
        }),

        loader: async ({ params }) => {
            const context: HttpContext = new HttpContext()
                .set(SUCCESS_MESSAGE, false);

            const res: Message<Post> = await firstValueFrom(
                this._post.getPostWithID(params.id, { context })
            );

            if (!res.data) {
                this._toastService.error("Erreur lors de la récupération de l'article, mauvaise page.", {
                    duration: 5000
                });
                return null;
            }
            return res.data;
        },
    });

}