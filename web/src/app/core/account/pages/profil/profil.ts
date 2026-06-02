import { Component, inject, OnInit, resource, signal, Signal, WritableSignal } from "@angular/core";
import { DangerButtonComponent } from "src/app/shared/ui/form/buttons/button-danger/button-danger";
import { BaseButtonComponent } from "src/app/shared/ui/form/buttons/base-button";
import { User, UserService } from "src/app/core/services/user.service";
import { SessionService } from "src/app/core/services/session.service";
import { Message } from "src/app/core/models/message.model";
import { firstValueFrom } from "rxjs";
import { HttpContext } from "@angular/common/http";
import { SUCCESS_MESSAGE } from "src/app/core/toasts/models/toasts.config";
import { Post, PostService } from "src/app/core/services/post.service";
import { PaginatorComponent } from "src/app/shared/ui/paginator/paginator";

@Component({
  selector: 'app-profil-page',
  imports: [DangerButtonComponent, BaseButtonComponent, PaginatorComponent],
  standalone: true,
  templateUrl: './profil.html',
  styleUrls: ['./profil.scss']
})
export class ProfilPageComponent implements OnInit {
  constructor () {}
  
  private _session: SessionService = inject(SessionService)
  private _user: UserService = inject(UserService)
  private _post: PostService = inject(PostService)

  sessionId = this._session.getUserIdSync();
  user: WritableSignal<User | undefined> = signal(undefined)
  
  async ngOnInit(): Promise<void> {
    if (!this.sessionId) return;
    const context: HttpContext = new HttpContext().set(SUCCESS_MESSAGE, false)
    const res: Message<User> = await firstValueFrom(this._user.findUserWithId(this.sessionId, {context}));
    this.user.set(res.data)
  }

  drafts = resource<Post[], Error>({
    loader: async () => {
        if (!this.sessionId) return [];
        const context: HttpContext = new HttpContext().set(SUCCESS_MESSAGE, false)
      const res: Message<Post[]> = await firstValueFrom(this._post.getDraftsPostsOfUser(this.sessionId, {context}));
      return res.data;
    },
  });

  showDraftsPosts: boolean = false;
}