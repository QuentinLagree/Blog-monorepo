import { DatePipe } from "@angular/common";
import { HttpContext } from "@angular/common/http";
import { Component, OnInit, resource, signal, WritableSignal } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { MarkdownComponent } from "ngx-markdown";
import { firstValueFrom } from "rxjs";
import { SUCCESS_MESSAGE } from "src/app/shared/helpers/toasts/models/toasts.config";
import { SessionService } from "src/app/shared/services/session.service";
import { User, UserService } from "src/app/shared/services/user.service";
import { Message } from "src/app/shared/types/message.type";
import { BaseButtonComponent } from "src/app/shared/ui/form/buttons/base-button";
import { PostService } from "../../data-access/post.service";
import { Post } from "../../model/post.model";

@Component({
  selector: 'app-post-detail',
  templateUrl: './post-detail.html',
  imports: [MarkdownComponent, DatePipe, BaseButtonComponent],
  styleUrls: ['./post-detail.scss'],
  standalone: true,
})
export class PostDetailComponent implements OnInit {
  slug_title: string = "";

  author: WritableSignal<User | undefined> = signal(undefined);

  constructor(
    private readonly _activatedRoutes: ActivatedRoute,
    private readonly _route: Router,
    private readonly _user: UserService,
    private readonly _post: PostService,
    private readonly _session: SessionService
  ) {}

  ngOnInit() {
    this.slug_title = this._activatedRoutes.snapshot.params['title'];
  }

  post = resource<Post, Error>({
    loader: async () => {
      const context: HttpContext = new HttpContext().set(SUCCESS_MESSAGE, false);

      const slug = this._activatedRoutes.snapshot.params['title']
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      const res: Message<Post> = await firstValueFrom(
        this._post.getPublishedDetail(slug, { context })
      );

      const post = res.data;
      const sessionId = this._session.getUserIdSync();

      if (post.published_at == null && sessionId !== post.authorId) {
        this._route.navigate(['/home']);
      }

      if (post.authorId) {
        const userRes: Message<User> = await firstValueFrom(
          this._user.findUserWithId(post.authorId, { context })
        );

        this.author.set(userRes.data);
      }

      return post;
    },
  });

  readingTime(): number {
    const content = this.post.value()?.content ?? '';

    const words = content
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;

    return Math.max(1, Math.ceil(words / 200));
  }

  contribute() {
    throw new Error('Method not implemented.');
  }

  sharePost() {
    throw new Error('Method not implemented.');
  }

  goBack() {
    this._route.navigate(['']);
  }
}