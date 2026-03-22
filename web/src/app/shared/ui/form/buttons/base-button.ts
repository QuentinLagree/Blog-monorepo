import { Component, EventEmitter, HostBinding, inject, input, InputSignal, Output } from '@angular/core';
import { IconLoaderService } from '@src/app/shared/helpers/icons/services/icons-loader';

export type ButtonType = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success' | 'outlined' | 'warn';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  templateUrl: './base-button.html',
  styleUrl: './base-button.scss'
})
export class BaseButtonComponent {
  private readonly _iconLoader: IconLoaderService = inject(IconLoaderService);
  @Output() clicked: EventEmitter<void> = new EventEmitter<void>();

  type: InputSignal<ButtonType> = input<ButtonType>('primary');
  size: InputSignal<ButtonSize> = input<ButtonSize>('md');
  label: InputSignal<string | undefined> = input<string | undefined>('');
  icon: InputSignal<string | undefined> = input<string | undefined>(undefined);
  disabled: InputSignal<boolean> = input<boolean>(false);
  loading: InputSignal<boolean> = input<boolean>(false);

  @HostBinding('class')
  get hostClasses() {
    return `btn-${this.type()} ${this.size()}`;
  }

  onClick(event: Event) {
    event.preventDefault()
    if (this.disabled() || this.loading()) return;
    this.clicked.emit();
  }
}
