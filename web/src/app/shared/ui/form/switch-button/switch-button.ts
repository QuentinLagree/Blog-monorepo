import {
  Component,
  computed,
  Input,
  input,
  InputSignal,
  signal,
  WritableSignal,
} from '@angular/core';
import {
  FormControl,
  ReactiveFormsModule,
} from '@angular/forms';

import { CheckboxConfig } from './models/checkbox-config';

@Component({
  selector: 'app-switch-button',
  standalone: true,
  templateUrl: './switch-button.html',
  styleUrls: ['./switch-button.scss'],
  imports: [
    ReactiveFormsModule,
  ],
})
export class SwitchButtonComponent {
  @Input({
    required: true,
  })
  control: FormControl<boolean> = new FormControl(true, {
      nonNullable: true,
    });
;

  readonly configuration:
    InputSignal<Partial<CheckboxConfig>> =
      input.required<
        Partial<CheckboxConfig>
      >();

  readonly localOverrides:
    WritableSignal<Partial<CheckboxConfig>> =
      signal({});

  readonly defaultConfiguration:
    CheckboxConfig = {
      label: '',
      required: true,
      type: 'checkbox',
    };

  readonly mergeConfigs =
    computed<CheckboxConfig>(() => ({
      ...this.defaultConfiguration,
      ...(this.configuration() ?? {}),
      ...(this.localOverrides() ?? {}),
    }));
}