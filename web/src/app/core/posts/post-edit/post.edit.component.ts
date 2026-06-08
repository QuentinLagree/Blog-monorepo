import { Component, computed, inject, OnInit, resource } from "@angular/core";
import { PostFormComponent } from "../post-form/post-form";
import { Post, PostService } from "../../services/post.service";
import { ToastService } from "../../toasts/toaster.service";
import { toSignal } from "@angular/core/rxjs-interop";
import { ActivatedRoute, Router } from "@angular/router";
import { HttpContext } from "@angular/common/http";
import { SUCCESS_MESSAGE } from "../../toasts/models/toasts.config";
import { firstValueFrom } from "rxjs";
import { Message } from "../../models/message.model";

@Component({
    selector: 'app-edit-post',
    template: `
    
    @if (this.post.value()){
        {{ post.value()?.title }}
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

    private queryParamsMap = toSignal(this._activatedRoute.queryParamMap, {
        initialValue: this._activatedRoute.snapshot.queryParamMap
    })
    ngOnInit() {
        this._activatedRoute.params.subscribe(params => { this.id = params['id']; })
    }
    post = resource<Post | null, { id: number }>({
        params: () => ({
            id: +this.id,
        }),

        loader: async ({ params }) => {
            console.log('reload article with id ' + params.id);

            const context: HttpContext = new HttpContext()
                .set(SUCCESS_MESSAGE, false);

            const res: Message<Post> = await firstValueFrom(
                this._post.getPostWithID(params.id, { context })
            );

            if (!res.data) {
                this._toastService.error("Erreur lors de la récupération des articles, mauvaise page.", {
                    duration: 5000
                });
                return null;
            }
            return res.data;
        },
    });

}