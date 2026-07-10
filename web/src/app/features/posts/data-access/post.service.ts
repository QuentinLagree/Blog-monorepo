import { inject, Injectable } from "@angular/core";
import { HttpOptions, HttpRequestService } from "@src/app/shared/services/http-service/get-request";
import { Observable } from "rxjs";
import { CreatePostPayload } from "./post-form-submit.service";
import { Post } from "../model/post.model";
import { PublishPost } from "../model/post-publish.model";
import { UpdatedPost } from "../model/post-update.model";
import { Message } from "src/app/shared/types/message.type";



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