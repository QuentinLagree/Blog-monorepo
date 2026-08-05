import {
  Component,
  input,
  output,
} from '@angular/core';

import { BaseButtonComponent } from
  'src/app/shared/ui/form/buttons/base-button';
import { TableOfContentsItem } from '../models/post-detail.types';

@Component({
  selector: 'app-post-reading-panel',
  standalone: true,
  imports: [
    BaseButtonComponent,
  ],
  templateUrl:
    './post-detail-reading-panel.html',
  styleUrls: [
    './post-detail-reading-panel.scss'
  ]
})
export class PostReadingPanelComponent {
  readonly opened =
    input.required<boolean>();

  readonly progress =
    input.required<number>();

  readonly headings =
    input.required<
      TableOfContentsItem[]
    >();

  readonly activeHeadingIndex =
    input.required<number>();

  readonly activeHeading =
    input<
      TableOfContentsItem | null
    >(null);

  readonly closeRequested =
    output<void>();

  readonly openRequested =
    output<void>();

  readonly headingSelected =
    output<string>();

  readonly contributionRequested =
    output<void>();
}