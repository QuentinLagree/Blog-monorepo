import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  Input,
  signal,
} from '@angular/core';
import { PostCard } from "../card/post-card/post-card";
import { Post } from "@src/app/core/services/post.service";
import { BaseButtonComponent } from "../form/buttons/base-button";
import { ActivatedRoute, Router } from '@angular/router';


@Component({
  standalone: true,
  selector: 'ng-paginator',
  styleUrl: "./paginator.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (item of page(); track item.id) {
      <app-post-card [post]="item"></app-post-card>
    } @empty {
      <div class="main container py-5">
        <p>Ce ci est un texte inidiquant que la ressource n'est pas trouvé</p>
      </div>
    }

    <div class="flex between">
      <div class="frow  gap-2">
        @for (page of [].constructor(pageCount()); track $index) {
          <app-button [type]="($index == currentPageIndex()) ? 'secondary' : 'primary'"  (click)="goToPage($index)" [class.rounded-s-lg]="$index === 0" [class.font-black]="currentPageIndex() === $index" label="{{ $index + 1}}">
          </app-button>
        }
      </div>
       <div class="frow flex-end gap-2">
      <app-button type="primary" label="<" (click)="prev()"></app-button>
      <app-button type="primary" label=">" (click)="next()"></app-button>
        
    </div>
  `,
  imports: [PostCard, BaseButtonComponent],
})
export class PaginatorComponent {

  private _router = inject(Router)
  // will be removed once signal based inputs are released!
  @Input({ alias: 'items' }) set _items(items: Post[]) {
    this.items.set(items);
  }
  @Input({ alias: 'currentPageIndex' }) set _currentPageIndex(
    currentPageIndex: number
  ) {
    this.currentPageIndex.set(currentPageIndex - 1);
  }
  @Input({ alias: 'pageSize' }) set _pageSize(pageSize: number) {
    this.pageSize.set(pageSize);
  }

  pageSizes = [5, 10];

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
      },
      { allowSignalWrites: true }
    );
  }

  private navigateToCurrentIndex() {
    this._router.navigate(['/home'], {
      queryParams: { page: this.currentPageIndex() + 1 }
    });
  }

  goToPage(index: number) {
    this.currentPageIndex.set(index)
    this.navigateToCurrentIndex()
  }

  next() {
    if (this.currentPageIndex() < this.pageCount() - 1) {
      this.currentPageIndex.update((index) => index + 1);
      this.navigateToCurrentIndex()
    }
  }

  prev() {
    if (this.currentPageIndex() > 0) {
      this.currentPageIndex.update((index) => index - 1);
      this.navigateToCurrentIndex()
    }
  }
}
