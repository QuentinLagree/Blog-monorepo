import { Component, input, InputSignal } from '@angular/core';
import { BaseButtonComponent, ButtonSize, ButtonType } from '../base-button';
import { IconLoaderService } from '@src/app/shared/helpers/icons/services/icons-loader';

@Component({
  selector: 'app-button-edit',
  templateUrl: '../base-button.html',
  styleUrls: ['../base-button.scss'],
})
export class EditButtonComponent extends BaseButtonComponent {
  override type: InputSignal<ButtonType> = input<ButtonType>('warn');
  override size: InputSignal<ButtonSize> = input<ButtonSize>('sm');
  override label: InputSignal<string | undefined> = input<string | undefined>("Modifier");
  override icon: InputSignal<string | undefined> = input<string | undefined>("icon-edit-pencil");
  noLabel: InputSignal<boolean | undefined> = input<boolean | undefined>(false);
}
