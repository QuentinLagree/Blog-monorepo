import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { validateInput } from 'src/app/shared/helpers/validation/input-validator.helper';
import { TextAreaValidationContext } from '../models/textarea-validation-context.interface';

export function TextAreaValidatorFactory(
  config: Partial<TextAreaValidationContext> = {}
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const context: TextAreaValidationContext = {
      maxlength: 255,
      required: true,
      validate: true,
      type: 'text',
      value: (control.value || '').toString(),
      options: {
        acceptSpecialCaracters: false
      },
      ...config
    };

    if (context.validate === true) {
      return validateInput(context);
    }
    return null;
  };
}
