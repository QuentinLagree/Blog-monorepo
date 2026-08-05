import {
  Component,
  output,
} from '@angular/core';

import { BaseButtonComponent } from
  'src/app/shared/ui/form/buttons/base-button';

@Component({
  selector: 'app-post-contribution-cta',
  standalone: true,
  imports: [
    BaseButtonComponent,
  ],
  templateUrl:
    './post-detail-contribution-cta.html',
})
export class PostContributionCtaComponent {
  readonly contributionRequested =
    output<void>();

  readonly backRequested =
    output<void>();
}