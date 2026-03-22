import { ValidationErrors } from '@angular/forms';
import { OptionalValideInput } from './optional-validator.helper';
import { InputValidationContext } from '../../ui/form/inputs/models/input-validation-context.interface';
import { TextAreaValidationContext } from '../../ui/form/text-area/models/textarea-validation-context.interface';

export function validateInput(context: InputValidationContext | TextAreaValidationContext): ValidationErrors | null {
  let errors: ValidationErrors = {};

  const value = context.value.trim() || '';

  if (!context.validate) return [];


  if (context.required && value === '') {

    if (context.type === 'select') {
      errors['required-select'] = true;
    } else if (context.type === 'multi-select') {
      errors['required-multi-select'] = true;
    } else {
      errors['required'] = true;
    }
  }

  if (context.maxlength) {
    if (context.type === 'multi-select') {
      if (context.value.split(',').length > context.maxlength - 1) {
        errors['maxcount-multi-select'] = {
          requiredLength: context.maxlength
        };
      }
    } else {
      if (value.length > (context.maxlength ?? 0)) {
        errors['maxlength'] = {
          requiredLength: context.maxlength,
          actualLength: value.length
        };
      }
    }
  }

  if (context.minlength) {
    if (value.length < (context.minlength ?? 0)) {
      errors['minlength'] = {
        requiredLength: context.minlength,
        actualLength: value.length
      };
    }
  }

  if (context.options) errors = { ...OptionalValideInput(value, context.options), ...errors };

  return Object.keys(errors).length > 0 ? errors : null;
}
