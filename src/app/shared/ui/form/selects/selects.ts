import { Component } from '@angular/core';
import { BaseInputComponent } from '../inputs/base-input';
import { SelectConfig } from './models/select-config';
import { ReactiveFormsModule } from '@angular/forms';
import { InputErrorComponent } from '../inputs/inputs-error/inputs-error';

@Component({
  selector: 'app-select',
  templateUrl: './selects.html',
  styleUrls: ['./selects.scss'],
  imports: [ReactiveFormsModule, InputErrorComponent]
})
export class SelectComponent extends BaseInputComponent<SelectConfig> {
  override defaultConfiguration: SelectConfig = {
    label: 'Label',
    placeholder: 'Choisissez une valeur.',
    type: 'select',
    choices: ['Valeur par défaut'],
    required: true
  };
}
