import {
  computed,
  Directive,
  input,
  Input,
  InputSignal,
  signal,
  WritableSignal
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { GetInputErrorMessage } from 'src/app/shared/helpers/validation/input-validation-message.util';
import { InputConfig } from './models/input-config.model';

@Directive()
export abstract class BaseInputComponent<TConfig extends InputConfig = InputConfig> {
  @Input() control!: FormControl;
  abstract defaultConfiguration: TConfig;
  configuration: InputSignal<Partial<TConfig>> = input.required<Partial<TConfig>>();
  localOverrides: WritableSignal<Partial<TConfig>> = signal({});

  readonly mergeConfigs = computed<TConfig>(() => ({
    ...this.defaultConfiguration,
    ...(this.configuration() ?? {}),
    ...(this.localOverrides() ?? {})
  }));

  get errorMessages(): string | null {
    return GetInputErrorMessage(this.control);
  }

  updateConfig = (patch: Partial<TConfig>) => {
    this.localOverrides.set({
      ...this.localOverrides(),
      ...patch
    });
  };
}
