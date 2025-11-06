import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { validateInput } from 'src/app/shared/helpers/validation/input-validator.helper';
import { SelectValidationContext } from './select-validation.context.interface';

export function MutliSelectValidatorFactory(
  config: Omit<SelectValidationContext, 'value' | 'type'> = {}
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const context: SelectValidationContext = {
      value: (control.value || '').toString(),
      required: true,
      type: 'multi-select',
      validate: true,
      maxlength: 3,
      ...config
    };

    return validateInput(context);
  };
}
