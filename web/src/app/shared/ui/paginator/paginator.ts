import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  Input,
  signal,
} from '@angular/core';
import { PostCard } from "../card/post-card/post-card";
import { Post } from "@src/app/core/services/post.service";


@Component({
  standalone: true,
  selector: 'ng-paginator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (item of page(); track $index) {
      <app-post-card [post]="item"></app-post-card>
    }

    <div class="flex items-center justify-between mt-8">
      <div class="inline-flex rounded shadow-lg">
        @for (size of pageSizes; track $index) {
          <button (click)="pageSize.set(size)" class="px-3 py-1 text-sm font-medium bg-white border border-gray-200" [class.rounded-s-lg]="$index === 0"  [class.rounded-e-lg]="$index === pageSizes.length - 1" [class.font-black]="pageSize() === size">
            {{size}}
          </button>
        }
      </div>
      <span><strong>{{currentPageIndex() + 1 }}</strong> of {{ pageCount() }}</span>
      <div>
        <button class="px-2 pb-1 rounded shadow-lg hover:shadow-md bg-white font-bold mr-2" (click)="prev()"><</button>
        <button class="px-2 pb-1 rounded shadow-lg hover:shadow-md bg-white font-bold mr-2" (click)="next()">></button>
      </div>
    </div>
  `,
  imports: [PostCard],
})
export class PaginatorComponent {
  // will be removed once signal based inputs are released!
  @Input({ alias: 'items' }) set _items(items: Post[]) {
    this.items.set(items);
  }
  @Input({ alias: 'currentPageIndex' }) set _currentPageIndex(
    currentPageIndex: number
  ) {
    this.currentPageIndex.set(currentPageIndex);
  }
  @Input({ alias: 'pageSize' }) set _pageSize(pageSize: number) {
    this.pageSize.set(pageSize);
  }

  pageSizes = [5, 10, 20];

  // will be converted to inputs...  items = input([]);
  items = signal<Post[]>([]);
  currentPageIndex = signal(0);
  pageSize = signal(5);

  // computed derived state and effect...
  pageCount = computed(() => Math.ceil(this.items().length / this.pageSize()));
  page = computed(() => {
    const startIndex = this.pageSize() * this.currentPageIndex();
    const endIndex = startIndex + this.pageSize();
    return this.items().slice(startIndex, endIndex);
  });

  constructor() {
    effect(
      () => {
        this.items();
        this.pageSize();
        this.currentPageIndex.set(0);
      },
      { allowSignalWrites: true }
    );
  }

  next() {
    if (this.currentPageIndex() < this.pageCount() - 1) {
      this.currentPageIndex.update((index) => index + 1);
    }
  }

  prev() {
    if (this.currentPageIndex() > 0) {
      this.currentPageIndex.update((index) => index - 1);
    }
  }
}
