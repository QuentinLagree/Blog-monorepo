import {
  Component,
  ElementRef,
  ViewChild,
  input,
  output,
} from '@angular/core';
import { MarkdownComponent } from
  'ngx-markdown';

import { BaseButtonComponent } from
  'src/app/shared/ui/form/buttons/base-button';
import { TableOfContentsItem } from '../models/post-detail.types';
import { PostReadingPanelComponent } from "../post-detail-reading-panel/post-detail-reading-panel";
import { PostContributionCtaComponent } from "../post-detail-contribution-cta/post-detail-contribution-cta";

@Component({
  selector: 'app-post-detail-content',
  standalone: true,
  imports: [
    MarkdownComponent,
    BaseButtonComponent,
    PostReadingPanelComponent,
    PostContributionCtaComponent
],
  templateUrl:
    './post-detail-content.html',
})
export class PostDetailContentComponent {
  @ViewChild('markdownContent', {
    read: ElementRef,
  })
  private markdownContent?:
    ElementRef<HTMLElement>;

  readonly content =
    input.required<string>();

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

  readonly mobileSummaryOpened =
    input.required<boolean>();

  readonly readingPanelOpened =
    input.required<boolean>();

  readonly markdownReady =
    output<HTMLElement>();

  readonly mobileSummaryToggled =
    output<void>();

  readonly mobileSummaryClosed =
    output<void>();

  readonly readingPanelClosed =
    output<void>();

  readonly readingPanelOpenedRequested =
    output<void>();

  readonly headingSelected =
    output<string>();

  readonly contributionRequested =
    output<void>();

  readonly backRequested =
    output<void>();

  onMarkdownReady(): void {
    const element =
      this.markdownContent
        ?.nativeElement;

    if (element) {
      this.markdownReady.emit(
        element,
      );
    }
  }
}