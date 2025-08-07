import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { validateInput } from 'src/app/shared/helpers/validation/input-validator.helper';
import { SelectValidationContext } from './select-validation.context.interface';

export function SelectValidatorFactory(
  config: Omit<SelectValidationContext, 'value' | 'type'> = {}
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const context: SelectValidationContext = {
      type: 'select',
      required: true,
      value: (control.value || '').toString(),
      ...config
    };

    return validateInput(context);
  };
}
