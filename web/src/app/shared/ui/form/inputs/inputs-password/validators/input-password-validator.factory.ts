import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { InputValidationContext } from '../../models/input-validation-context.interface';
import { validateInput } from 'src/app/shared/helpers/validation/input-validator.helper';

export function PasswordInputValidatorFactory(
  config: Omit<InputValidationContext, 'value' | 'type'> = {}
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const context: InputValidationContext = {
      type: 'password',
      minlength: 8,
      required: true,
      value: (control.value || '').toString(),
      options: {
        useStrengthCheck: true,
        acceptSpecialCaracters: true
      },
      ...config
    };

    return validateInput(context);
  };
}
