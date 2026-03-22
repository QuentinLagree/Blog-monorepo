import { inject, Injectable } from "@angular/core";
import { HttpOptions, HttpRequestService } from "@src/app/shared/services/http-service/get-request";
import { Observable } from "rxjs";
import { Message } from "../models/message.model";

export interface Post {
    id?: number;
    authorId: number,
    title: string,
    content: string,
    description: string,
    published: boolean,
    created_at: Date
}

@Injectable({
    providedIn: 'root'
})
export class PostService {
    private readonly _http: HttpRequestService = inject(HttpRequestService);

    getAllPublishedPost(options?: HttpOptions): Observable<Message> {
        return this._http.getData('posts/published', options)
    }

    publishPost(post: Post, options?: HttpOptions) {
        return this._http.postData('posts', post, options)
    }
}