import { inject, Injectable } from "@angular/core";
import { HttpOptions, HttpRequestService } from "@src/app/shared/services/http-service/get-request";
import { Observable } from "rxjs";
import { Message } from "../models/message.model";
import { CreatePostPayload } from "./post-form-submit.service";

export interface Post {
    id?: number;
    authorId: number,
    title: string,
    content: string,
    description: string,
    published_at: string,
    created_at: Date
}



export interface PublishPost {
    id?: number;
    published_at: string,
}

export interface UpdatedPost {
    title: string,
    content: string,
    description: string,
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
        return this._http.getData(`posts?page=${page}&limit=${limit}&published=true`, options)
    }

    createPost(post: CreatePostPayload, options?: HttpOptions) {
        return this._http.postData('users/posts', post, options)
    }

    publishPost(post: PublishPost, options?: HttpOptions) {
        return this._http.patchData(`users/posts/${post.id}/publish`, post, options)
    }

    getPostWithID(id: number, options?: HttpOptions): Observable<Message<Post>> {
        return this._http.getData(`posts/${id}`, options)
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