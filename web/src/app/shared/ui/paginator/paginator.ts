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
import { Post, PostService } from "@src/app/core/services/post.service";
import { BaseButtonComponent } from "../form/buttons/base-button";
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from 'src/app/core/services/user.service';


type ItemContaien = "POST_CARD" | "USER_CARD" | "NOTHING"

@Component({
  standalone: true,
  selector: 'ng-paginator',
  styleUrl: "./paginator.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (item of page(); track item.id) {
      @switch (this.itemContainer()) {
        @case ("NOTHING") {
          <h1>Item : {{ item.title }}</h1>
        }
        @case ("POST_CARD") {
          @let post = this._post.asPost(item);
          <app-post-card [isDraft]="isDraft()" [post]="post"></app-post-card>
        }
        @case ("USER_CARD") {
          @let user = this._user.asUser(item);
          <h1>{{user.email}}</h1>
        }
      }
    } @empty {
      <div class="main container py-5">
        <p>Ce ci est un texte inidiquant que la ressource n'est pas trouvé</p>
      </div>
    }

    @if (this.pageCount() > 1) {
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
</div>
      }
  `,
  imports: [PostCard, BaseButtonComponent],
})
export class PaginatorComponent {

  protected _user: UserService = inject(UserService)
  protected _post: PostService = inject(PostService)

  private _router = inject(Router)
  @Input({ alias: 'items' }) set _items(items: any[]) {
    this.items.set(items);
  }

    @Input({ alias: 'itemContainer' }) set _itemContainer(itemContainer: ItemContaien) {
    this.itemContainer.set(itemContainer);
  }

  @Input({ alias: 'isDraft' }) set _isDrafts(isDraft: boolean) {
    this.isDraft.set(isDraft);
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

  items = signal<any[]>([]);
  itemContainer = signal<ItemContaien>("NOTHING");
  isDraft = signal<boolean>(false)
  currentPageIndex = signal(0);
  pageSize = signal(5);

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
