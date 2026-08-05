import { DatePipe } from '@angular/common';
import {
  Component,
  input,
  output,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  User,
} from 'src/app/shared/services/user.service';
import { PostDetailAsideComponent } from '../post-detail-aside/post-detail-aside';
import { Post } from '../../../model/post.model';


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
  readonly post =
    input.required<Post>();

  readonly author =
    input<User | undefined>();

  readonly readingTime =
    input.required<number>();

  readonly showReadingTime =
    input.required<boolean>();

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
}