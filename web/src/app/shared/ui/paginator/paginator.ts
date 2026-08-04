import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  Signal,
  computed,
  signal,
} from '@angular/core';
import { BaseButtonComponent } from '../form/buttons/base-button';
import { FormControl } from '@angular/forms';
import { SelectValidatorFactory } from '../form/selects/models/select-validator.factory';


@Component({
  standalone: true,
  selector: 'ng-paginator',
  styleUrl: './paginator.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BaseButtonComponent],
  template: `
    @if (pageCount() > 1) {
  <nav class="paginator" aria-label="Pagination">
    <div class="paginator__pages">
      @for (page of pages(); track page) {
        <app-button
          size="sm"
          [type]="page === currentPage() ? 'secondary' : 'ghost'"
          [label]="page.toString()"
          (click)="goToPage(page)">
        </app-button>
      }
    </div>
    <div class="paginator__controls">
      Limite:
      <div class="paginator__pages">
      @for (limit of limits(); track limit) {
        <app-button
          size="sm"
          [type]="limit === pageSize() ? 'secondary' : 'ghost'"
          [label]="limit.toString()"
          (click)="changeSize(limit)">
        </app-button>
      }
    </div>
      <app-button
        size="sm"
        type="secondary"
        label="Précédent"
        (click)="previous()"
        [disabled]="currentPage() === 1">
      </app-button>

      <app-button
        size="sm"
        type="secondary"
        label="Suivant"
        (click)="next()"
        [disabled]="currentPage() === pageCount()">
      </app-button>
    </div>
  </nav>
}
  `,
})
export class PaginatorComponent {
  @Output() pageChange = new EventEmitter<number>();
  @Output() sizeChange = new EventEmitter<number>();

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

  selectControl = new FormControl('', [
    SelectValidatorFactory({
      validate: false,
      required: false,
    })
  ]);

  limits: Signal<number[]> = signal([2, 5, 10])

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

  changeSize(limit: number): void {
    if (!this.limits().includes(limit)) return;

    this._pageSize.set(limit);
    this.sizeChange.emit(limit);
  }

  next(): void {
    this.goToPage(this.currentPage() + 1);
  }

  previous(): void {
    this.goToPage(this.currentPage() - 1);
  }
}