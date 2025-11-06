import { Component, input, InputSignal } from '@angular/core';
import { BaseButtonComponent, ButtonSize, ButtonType } from '../base-button';

@Component({
  selector: 'app-button-danger',
  templateUrl: '../base-button-simple.html',
  styleUrls: ['../base-button.scss']
})
export class DangerButtonComponent extends BaseButtonComponent {
  override type: InputSignal<ButtonType> = input<ButtonType>('danger');
  override size: InputSignal<ButtonSize> = input<ButtonSize>('md');
  override label: InputSignal<string> = input<string>('Supprimer');
}
