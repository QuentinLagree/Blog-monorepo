import { Component, inject, Input } from '@angular/core';
import { slideDown } from 'src/app/shared/animations/eyeAnimation.animation';
import { InputPasswordConfig } from '../../models/input-password-config.model';
import { IconLoaderService } from '@src/app/shared/helpers/icons/services/icons-loader';

@Component({
  selector: 'app-input-password-toggle',
  templateUrl: './input-password-toggle.html',
  styleUrl: './input-password-toggle.scss',
  standalone: true,
  animations: [slideDown]
})
export class InputPasswordToggleComponent {
  private readonly _iconLoader: IconLoaderService = inject(IconLoaderService);

  @Input({ required: true }) config!: Partial<InputPasswordConfig>;

  @Input({ required: true })
  updateType!: (patch: Partial<InputPasswordConfig>) => void;

  toggleType() {
    const newType = this.config.type === 'password' ? 'text' : 'password';

    this.updateType({
      type: newType
    });
  }
}
