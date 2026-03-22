import { Component, input, InputSignal } from '@angular/core';
import { BaseButtonComponent, ButtonSize, ButtonType } from '../base-button';

@Component({
  selector: 'app-button-danger',
  templateUrl: '../base-button.html',
  styleUrls: ['../base-button.scss']
})
export class DangerButtonComponent extends BaseButtonComponent {
  override type: InputSignal<ButtonType> = input<ButtonType>('danger');
  override icon: InputSignal<string | undefined> = input<string| undefined>('icon-cancel');
  override size: InputSignal<ButtonSize> = input<ButtonSize>('sm');
  override label: InputSignal<string | undefined> = input<string | undefined>('Supprimer');
}
