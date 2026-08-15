import { DatePipe } from '@angular/common';
import {
  Component,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  User,
} from 'src/app/shared/services/user.service';
import { PostDetailAsideComponent } from '../post-detail-aside/post-detail-aside';
import { Post } from '../../../model/post.model';
import { UserPreferencesService } from 'src/app/features/account/pages/profil/preferences.service';


@Component({
  selector: 'app-post-detail-header',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    PostDetailAsideComponent,
  ],
  templateUrl:
    './post-detail-header.html',
})
export class PostDetailHeaderComponent {

  private readonly _preferences = inject(UserPreferencesService)
  
  readonly auth =
    input.required<boolean>()
  
  readonly post =
    input.required<Post>();

  readonly author =
    input<User | undefined>();

  readonly readingTime =
    input.required<number>();

  readonly isPostRead =
    input.required<boolean>();

  readonly hasStartedReading =
    input.required<boolean>();

  readonly savedReadingProgress =
    input.required<number>();

  readonly likesCount =
    input.required<number>();

  readonly hasLiked =
    input.required<boolean>();

  readonly likeLoading =
    input.required<boolean>();

  readonly isAuthor =
    input.required<boolean>();

  readonly likeToggled =
    output<void>();

  readonly contributionRequested =
    output<void>();

  readonly shareRequested =
    output<void>();

  readonly showReadingTime = signal(this._preferences.getPreference('showReadingTime'))
}