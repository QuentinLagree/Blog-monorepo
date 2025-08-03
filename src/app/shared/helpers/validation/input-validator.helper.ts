import { ValidationErrors } from "@angular/forms";
import { OptionalValideInput } from "./optional-validator.helper";
import { InputValidationContext } from "../../ui/form/inputs/models/input-validation-context.interface";



export function validateInput(context: InputValidationContext): ValidationErrors | null {
  let errors: ValidationErrors = {};
  
  const value = context.value.trim() || '';

  if (context.required && value === '') {
    errors['required'] = true;
  }

  if (context.maxlength) {
    if (value.length > (context.maxlength ?? 0)) {
      errors["maxlength"] = {
        requiredLength: context.maxlength,
        actualLength: value.length
      }
    }
  }

    if (context.minlength) {
      if (value.length < (context.minlength ?? 0)) {
        errors["minlength"] = {
          requiredLength: context.minlength,
          actualLength: value.length
        }
      }
    }

    if (context.options) errors = {...OptionalValideInput(value, context.options), ...errors};

  
  return Object.keys(errors).length > 0 ? errors : null;
}