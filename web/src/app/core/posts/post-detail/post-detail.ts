import { Component, OnInit, resource } from "@angular/core";
import { PostFormState } from "../post-form/post-form.state";
import { Post, PostService } from "../../services/post.service";
import { SessionService } from "../../services/session.service";
import { ActivatedRoute, Router } from "@angular/router";
import { firstValueFrom, Observable } from "rxjs";
import { Message } from "../../models/message.model";
import { HttpContext } from "@angular/common/http";
import { SUCCESS_MESSAGE } from "../../toasts/models/toasts.config";

@Component({
    selector: 'app-post-detail',
    templateUrl: './post-detail.html',
    imports: [],
    styleUrls: ['./post-detail.scss'],
    standalone: true,
})
export class PostDetailComponent implements OnInit {

    slug_title: string = "";

    constructor(
        private readonly _session: SessionService,
        private readonly _post: PostService,
        private readonly _activatedRoutes: ActivatedRoute,
        private readonly _route: Router
    ) { }

    ngOnInit() {
        this._activatedRoutes.params.subscribe(params => { this.slug_title = params['title']; })
    }

    post = resource<Post, Error>({
        loader: async () => {
            const context: HttpContext = new HttpContext().set(SUCCESS_MESSAGE, false)
            const res: Message<Post> = await firstValueFrom(this._post.getPublishedDetail(this.slug_title.normalize("NFD").replace(/[\u0300-\u036f]/g, ""), { context }));
            return res.data;
        },
    })
    sessionId = this._session.getUserIdSync();
    sessionRole = this._session.getUserRoleSync();


}