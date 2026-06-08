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

export interface UpdatedPost {
    title?: string,
    content?: string,
    description?: string,
}

@Injectable({
    providedIn: 'root'
})
export class PostService {
    private readonly _http: HttpRequestService = inject(HttpRequestService);

      asPost (value: unknown): Post {
        return value as Post;
      }
    

    getAllPublishedPost(page: number, limit: number, options?: HttpOptions): Observable<Message> {
        return this._http.getData(`posts?page=${page}&limit=${limit}`, options)
    }

    publishPost(post: Post, options?: HttpOptions) {
        return this._http.postData('posts', post, options)
    }

    getPostWithID(id: number, options?: HttpOptions): Observable<Message<Post>> {
        return this._http.getData(`posts/${id}`)
    }

    getPublishedDetail(slug: string, options?: HttpOptions): Observable<Message<Post>> {
        return this._http.getData(`posts/slug/${slug}`, options)
    }

    getDraftsPostsOfUser(userId: number, options?: HttpOptions): Observable<Message<Post[]>> {
        return this._http.getData(`users/posts/drafts/${userId}`, options);
    }

    updatePost(id: number, updatedPost: UpdatedPost, options?: HttpOptions) {
        return this._http.patchData(`posts/${id}`, updatedPost, options);
    }
}