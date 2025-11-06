import { Component } from '@angular/core';
import { BaseFormElementComponent } from '../base-input';
import { ReactiveFormsModule } from '@angular/forms';
import { InputConfig } from '../models/input-config.model';
import { InputErrorComponent } from '../inputs-error/inputs-error';

@Component({
  selector: 'app-input-email',
  templateUrl: '../input/input.html',
  styleUrls: ['../base-input.scss'],
  imports: [ReactiveFormsModule, InputErrorComponent],
  standalone: true
})
export class EmailInputComponent extends BaseFormElementComponent<InputConfig> {
  override defaultConfiguration: InputConfig = {
    label: 'Email',
    placeholder: 'placeholder : email',
    required: true,
    type: 'email'
  };
}
