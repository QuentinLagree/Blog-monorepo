import { Component, Input } from '@angular/core';
import { AbstractControl, ReactiveFormsModule } from '@angular/forms';
import { GetInputErrorMessage } from 'src/app/shared/helpers/validation/input-validation-message.util';

@Component({
  selector: 'app-input-error',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    @if (errorMessage) {
      <div class="error-message">
        {{ errorMessage }}
      </div>
    }
  `,
  styleUrls: ['./inputs-error.scss']
})
export class InputErrorComponent {
  @Input({ required: true }) control!: AbstractControl;

  get errorMessage(): string | null {
    if (!this.control || !this.control.errors) return null;

    const isTouchedOrDirty = this.control.touched || this.control.dirty;
    if (!isTouchedOrDirty) return null;

    return GetInputErrorMessage(this.control);
  }
}
