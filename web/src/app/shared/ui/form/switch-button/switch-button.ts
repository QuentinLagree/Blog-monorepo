import {
  Component,
  computed,
  Input,
  input,
  InputSignal,
  signal,
  WritableSignal
} from '@angular/core';
import { CheckboxConfig } from './models/checkbox-config';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-switch-button',
  templateUrl: './switch-button.html',
  styleUrls: ['./switch-button.scss'],
  imports: [ReactiveFormsModule]
})
export class SwitchButtonComponent {
  @Input() control!: FormControl;
  configuration: InputSignal<Partial<CheckboxConfig>> = input.required<Partial<CheckboxConfig>>();
  localOverrides: WritableSignal<Partial<CheckboxConfig>> = signal({});
  isChecked: WritableSignal<boolean> = signal<boolean>(false);

  defaultConfiguration: CheckboxConfig = {
    label: '',
    required: true,
    type: 'checkbox'
  };

  readonly mergeConfigs = computed<CheckboxConfig>(() => ({
    ...this.defaultConfiguration,
    ...(this.configuration() ?? {}),
    ...(this.localOverrides() ?? {})
  }));
  toggleChecked() {
    this.isChecked.set(!this.isChecked());
    this.control.setValue(this.isChecked());
    console.log(this.control);
  }
}
