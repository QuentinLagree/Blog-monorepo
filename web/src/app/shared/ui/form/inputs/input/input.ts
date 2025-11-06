import { InputConfig } from '../models/input-config.model';
import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { BaseFormElementComponent } from '../base-input';
import { InputErrorComponent } from '../inputs-error/inputs-error';

@Component({
  selector: 'app-input',
  imports: [ReactiveFormsModule, InputErrorComponent],
  templateUrl: './input.html',
  styleUrls: ['../base-input.scss'],
  standalone: true
})
export class InputComponent extends BaseFormElementComponent<InputConfig> {
  override defaultConfiguration: InputConfig = {
    label: 'Text',
    placeholder: 'placeholder : text',
    required: true,
    type: 'text'
  };
}
