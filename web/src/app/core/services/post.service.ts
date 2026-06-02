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
    published_at: Date,
    created_at: Date
}

@Injectable({
    providedIn: 'root'
})
export class PostService {
    private readonly _http: HttpRequestService = inject(HttpRequestService);

      asPost (value: unknown): Post {
        return value as Post;
      }
    

    getAllPublishedPost(options?: HttpOptions): Observable<Message> {
        return this._http.getData('posts/published', options)
    }

    publishPost(post: Post, page: number, limit: number, options?: HttpOptions) {
        return this._http.postData(`posts?page=${page}&limit=${limit}&published=true`, post, options)
    }

    getPublishedDetail(slug: string, options?: HttpOptions): Observable<Message<Post>> {
        return this._http.getData(`posts/slug/${slug}`, options)
    }

    getDraftsPostsOfUser(userId: number, options?: HttpOptions): Observable<Message<Post[]>> {
        return this._http.getData(`users/posts/drafts/${userId}`, options);
    }
}