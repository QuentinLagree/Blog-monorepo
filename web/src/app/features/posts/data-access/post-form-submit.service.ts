import { inject, Injectable } from "@angular/core";
import { of, switchMap } from "rxjs";
import { HttpContext } from "@angular/common/http";
import { SUCCESS_MESSAGE } from "src/app/shared/helpers/toasts/models/toasts.config";
import { UpdatedPost } from "../model/post-update.model";
import { Post } from "../model/post.model";
import { PostService } from "./post.service";

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