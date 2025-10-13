import { Component } from '@angular/core';
import { BaseFormElementComponent } from '../base-input';
import { InputPasswordConfig } from './models/input-password-config.model';
import { ReactiveFormsModule } from '@angular/forms';
import { InputPasswordMeterComponent } from './components/input-password-meter/input-password-meter';
import { InputPasswordToggleComponent } from './components/input-password-toggle/input-password-toggle';
import { InputErrorComponent } from '../inputs-error/inputs-error';

@Component({
  selector: 'app-input-password',
  templateUrl: './input-password.html',
  styleUrls: ['./input-password.scss', '../base-input.scss'],
  imports: [
    ReactiveFormsModule,
    InputPasswordMeterComponent,
    InputPasswordToggleComponent,
    InputErrorComponent
  ],
  standalone: true
})
export class InputPassswordComponent extends BaseFormElementComponent<InputPasswordConfig> {
  override defaultConfiguration: InputPasswordConfig = {
    label: 'Mot de passe',
    placeholder: 'placeholder : password',
    required: true,
    type: 'password',
    showPassword: false,
    displayStrenghMeterPassword: false
  };
}
