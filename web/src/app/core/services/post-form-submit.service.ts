import { inject, Injectable } from "@angular/core";
import { Post, PostService, UpdatedPost } from "./post.service";
import { of, switchMap } from "rxjs";
import { HttpOptions } from "src/app/shared/services/http-service/get-request";
import { HttpContext } from "@angular/common/http";
import { SUCCESS_MESSAGE } from "../toasts/models/toasts.config";

export type PostSaveMode = 'draft' | 'publish';

export type CreatePostPayload = {
  title: string;
  description: string;
  content: string;
  authorId: number;
  created_at: Date;
  published_at: string | Date | null;
};

@Injectable({ providedIn: 'root' })
export class PostFormSubmitService {
  private postService = inject(PostService);
  

  save(params: {
  currentPost?: Post;
  payload: UpdatedPost;
  authorId: number;
  mode: PostSaveMode;
}) {
  const { currentPost, payload, authorId, mode } = params;

  if (currentPost?.id) {
    return this.postService.updatePost(currentPost.id, payload);
  }

  const context: HttpContext = new HttpContext()
  .set(SUCCESS_MESSAGE, false);

  return this.postService
    .createPost({
      ...payload,
      authorId,
      created_at: new Date(),
      published_at: null,
    }, {context})
    .pipe(
      switchMap((message) => {
        const createdPost = message.data as Post;

        console.log("CREATE")

        if (mode === 'draft') {
          return of(message);
        }

        return this.postService.publishPost({
          id: createdPost.id,
          published_at: new Date().toISOString(),
        });
      })
    );
}
}