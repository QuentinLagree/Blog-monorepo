import { Component, EventEmitter, Input, Output } from '@angular/core';
import { BaseButtonComponent } from 'src/app/shared/ui/form/buttons/base-button';

export type ConfirmModalVariant = 'primary' | 'danger' | 'warning';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [BaseButtonComponent],
  templateUrl: './confirm-modal.html',
  styleUrls: ['./confirm-modal.scss'],
})
export class ConfirmModalComponent {
  @Input() showNote = true;
  @Input() open = false;

  @Input() title = 'Confirmer l’action';
  @Input() message = 'Es-tu sûr de vouloir continuer ?';

  @Input() confirmLabel = 'Confirmer';
  @Input() cancelLabel = 'Annuler';

  @Input() variant: ConfirmModalVariant = 'primary';
  @Input() loading = false;

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  cancel(): void {
    if (this.loading) return;
    this.cancelled.emit();
  }

  confirm(): void {
    if (this.loading) return;
    this.confirmed.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.cancel();
    }
  }
}