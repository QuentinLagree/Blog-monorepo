import {
  DOCUMENT,
  Injectable,
  computed,
  inject,
  signal,
} from '@angular/core';

import { TableOfContentsItem } from
  '../models/post-detail.types';

@Injectable()
export class PostReadingNavigationService {
  private readonly _document =
    inject(DOCUMENT);

  private content:
    HTMLElement | null = null;

  private headingObserver?:
    IntersectionObserver;

  private resizeObserver?:
    ResizeObserver;

  readonly tableOfContents =
    signal<TableOfContentsItem[]>([]);

  readonly activeHeadingIndex =
    signal(0);

  readonly progress =
    signal(0);

  readonly mobileSummaryOpened =
    signal(false);

  readonly activeHeading =
    computed(() => {
      const headings =
        this.tableOfContents();

      return (
        headings[
          this.activeHeadingIndex()
        ] ??
        headings[0] ??
        null
      );
    });

  initialize(
    content: HTMLElement,
  ): void {
    this.destroyObservers();

    this.content = content;

    const headingElements =
      this.getHeadingElements();

    const items =
      headingElements.map(
        (
          heading,
          index,
        ): TableOfContentsItem => {
          const id =
            heading.id ||
            this.createHeadingId(
              heading.textContent ?? '',
              index,
            );

          heading.id = id;

          return {
            id,
            label:
              heading.textContent?.trim() ||
              `Section ${index + 1}`,
            level:
              heading.tagName === 'H3'
                ? 3
                : 2,
          };
        },
      );

    this.tableOfContents.set(items);
    this.activeHeadingIndex.set(0);

    this.observeHeadings(
      headingElements,
    );

    if (
      typeof window !== 'undefined'
    ) {
      window.addEventListener(
        'scroll',
        this.handleViewportChange,
        {
          passive: true,
        },
      );
    }

    if (
      typeof ResizeObserver !==
      'undefined'
    ) {
      this.resizeObserver =
        new ResizeObserver(
          this.handleViewportChange,
        );

      this.resizeObserver.observe(
        content,
      );
    }

    this.handleViewportChange();
  }

  destroy(): void {
    if (
      typeof window !== 'undefined'
    ) {
      window.removeEventListener(
        'scroll',
        this.handleViewportChange,
      );
    }

    this.destroyObservers();
    this.content = null;

    this.tableOfContents.set([]);
    this.activeHeadingIndex.set(0);
    this.progress.set(0);
    this.mobileSummaryOpened.set(false);
  }

  scrollTo(
    headingId: string,
  ): void {
    const heading =
      this._document.getElementById(
        headingId,
      );

    if (!heading) {
      return;
    }

    heading.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });

    this.closeMobileSummary();
  }

  toggleMobileSummary(): void {
    this.mobileSummaryOpened.update(
      (opened) => !opened,
    );
  }

  closeMobileSummary(): void {
    this.mobileSummaryOpened.set(false);
  }

  private getHeadingElements():
    HTMLElement[] {
    if (!this.content) {
      return [];
    }

    return Array.from(
      this.content
        .querySelectorAll<HTMLElement>(
          'h2, h3',
        ),
    );
  }

  private readonly handleViewportChange =
    (): void => {
      const content =
        this.content;

      if (!content) {
        return;
      }

      this.updateProgress(content);

      this.updateClosestHeading(
        this.getHeadingElements(),
      );
    };

  private updateProgress(
    content: HTMLElement,
  ): void {
    const bounds =
      content.getBoundingClientRect();

    const viewportHeight =
      window.innerHeight;

    const articleStart =
      window.scrollY +
      bounds.top -
      viewportHeight * 0.25;

    const articleEnd =
      articleStart +
      content.offsetHeight -
      viewportHeight * 0.5;

    const readingDistance =
      articleEnd -
      articleStart;

    const rawProgress =
      readingDistance <= 0
        ? 100
        : (
          (
            window.scrollY -
            articleStart
          ) /
          readingDistance
        ) *
        100;

    this.progress.set(
      Math.round(
        Math.min(
          100,
          Math.max(
            0,
            rawProgress,
          ),
        ),
      ),
    );
  }

  private observeHeadings(
    headings: HTMLElement[],
  ): void {
    if (
      !headings.length ||
      typeof IntersectionObserver ===
        'undefined'
    ) {
      return;
    }

    this.headingObserver =
      new IntersectionObserver(
        (entries) => {
          const current =
            entries
              .filter(
                (entry) =>
                  entry.isIntersecting,
              )
              .sort(
                (
                  first,
                  second,
                ) =>
                  first
                    .boundingClientRect
                    .top -
                  second
                    .boundingClientRect
                    .top,
              )[0];

          if (!current) {
            this.updateClosestHeading(
              headings,
            );

            return;
          }

          const index =
            headings.indexOf(
              current.target as HTMLElement,
            );

          if (index >= 0) {
            this.activeHeadingIndex.set(
              index,
            );
          }
        },
        {
          rootMargin:
            '-18% 0px -68% 0px',
          threshold: [0, 1],
        },
      );

    headings.forEach(
      (heading) => {
        this.headingObserver?.observe(
          heading,
        );
      },
    );
  }

  private updateClosestHeading(
    headings: HTMLElement[],
  ): void {
    if (!headings.length) {
      return;
    }

    const readingLine =
      window.innerHeight * 0.28;

    let closestIndex = 0;
    let closestDistance =
      Number.POSITIVE_INFINITY;

    headings.forEach(
      (
        heading,
        index,
      ) => {
        const distance =
          Math.abs(
            heading
              .getBoundingClientRect()
              .top -
            readingLine,
          );

        if (
          distance <
          closestDistance
        ) {
          closestDistance =
            distance;

          closestIndex =
            index;
        }
      },
    );

    this.activeHeadingIndex.set(
      closestIndex,
    );
  }

  private destroyObservers(): void {
    this.headingObserver?.disconnect();
    this.resizeObserver?.disconnect();

    this.headingObserver = undefined;
    this.resizeObserver = undefined;
  }

  private createHeadingId(
    heading: string,
    index: number,
  ): string {
    const normalized =
      heading
        .normalize('NFD')
        .replace(
          /[\u0300-\u036f]/g,
          '',
        )
        .toLowerCase()
        .trim()
        .replace(
          /[^a-z0-9]+/g,
          '-',
        )
        .replace(
          /^-+|-+$/g,
          '',
        );

    return normalized
      ? `section-${normalized}-${index}`
      : `section-${index + 1}`;
  }
}