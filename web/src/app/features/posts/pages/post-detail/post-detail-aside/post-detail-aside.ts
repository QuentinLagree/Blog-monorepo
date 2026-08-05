import {
  Component,
  input,
  output,
} from '@angular/core';

import { User } from
  'src/app/shared/services/user.service';
import { BaseButtonComponent } from
  'src/app/shared/ui/form/buttons/base-button';

@Component({
  selector: 'app-post-detail-aside',
  standalone: true,
  imports: [
    BaseButtonComponent,
  ],
  templateUrl:
    './post-detail-aside.html',
})
export class PostDetailAsideComponent {
  readonly authenticated =
    input<boolean>(false)
  
  readonly author =
    input<User | undefined>();

  readonly readingTime =
    input.required<number>();

  readonly showReadingTime =
    input.required<boolean>();

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