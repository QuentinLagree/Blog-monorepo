import { Component, input, InputSignal } from '@angular/core';
import { BaseButtonComponent, ButtonSize, ButtonType } from '../base-button';

@Component({
  selector: 'app-button-add',
  templateUrl: '../base-button.html',
  styleUrls: ['../base-button.scss']
})
export class ButtonAddComponent extends BaseButtonComponent {
  override type: InputSignal<ButtonType> = input<ButtonType>('primary');
  override size: InputSignal<ButtonSize> = input<ButtonSize>('md');
  override icon: InputSignal<string | undefined> = input<string| undefined >('icon-plus');
  override label: InputSignal<string | undefined> = input<string | undefined>('Ajouter');
}
