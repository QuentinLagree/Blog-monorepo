import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  computed,
  signal,
} from '@angular/core';
import { BaseButtonComponent } from '../form/buttons/base-button';


@Component({
  standalone: true,
  selector: 'ng-paginator',
  styleUrl: './paginator.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BaseButtonComponent],
  template: `
    @if (pageCount() > 1) {
      <div class="flex between paginator">
        <div class="frow gap-2">
          @for (page of pages(); track page) {
            <app-button
              [type]="page === currentPage() ? 'secondary' : 'primary'"
              [label]="page.toString()"
              (click)="goToPage(page)"
            />
          }
        </div>

        <div class="frow gap-2 buttons flex-end">
          <app-button
            type="primary"
            label="<"
            (click)="previous()"
            [disabled]="currentPage() === 1"
          />

          <app-button
            type="primary"
            label=">"
            (click)="next()"
            [disabled]="currentPage() === pageCount()"
          />
        </div>
      </div>
    }
  `,
})
export class PaginatorComponent {
  @Output() pageChange = new EventEmitter<number>();

  @Input() set CurrentPage(value: number) {
    this._currentPage.set(value);
  }
  
  @Input() set PageSize(value: number) {
    this._pageSize.set(value);
  }

  @Input() set TotalItems(value: number) {
    this._totalItems.set(value);
  }

  private _currentPage = signal(1);
  private _pageSize = signal(5);
  private _totalItems = signal(0);

  currentPage = this._currentPage.asReadonly();
  pageSize = this._pageSize.asReadonly();
  totalItems = this._totalItems.asReadonly();

  pageCount = computed(() =>
    Math.ceil(this.totalItems() / this.pageSize())
  );

  pages = computed(() =>
    Array.from({ length: this.pageCount() }, (_, index) => index + 1)
  );

  goToPage(page: number): void {
    if (page < 1 || page > this.pageCount()) return;

    this._currentPage.set(page);
    this.pageChange.emit(page);
  }

  next(): void {
    this.goToPage(this.currentPage() + 1);
  }

  previous(): void {
    this.goToPage(this.currentPage() - 1);
  }
}