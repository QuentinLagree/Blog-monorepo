import { ValidationErrors } from "@angular/forms";
import { OptionalValidations } from "../../ui/form/inputs/models/optional-input-validation-context.interface";

export function OptionalValideInput(value: string, options: OptionalValidations): ValidationErrors | null {
    const errors: ValidationErrors = {}

    const EMAIL_VALIDATOR_REGEX: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    
    if (options.acceptSpecialCaracters === false) {
        if (/[!@#$%\^&*)(+=._-]/.test(value)) {
            errors["disabledSpecialCaracter"] = true
        }
    }

    if (options.hasValidEmail) {
          if (!EMAIL_VALIDATOR_REGEX.test(value)) {
            errors["email"] = true
        }
    }
    
    if (options.useStrengthCheck) {
        if (
            value.length < 8
            || !/[A-Z]/.test(value)
            || !/[!@#$%\^&*)(+=._-]/.test(value)
            || !/[0-9]/.test(value)) {
            errors["tooWeak"] = true
        }
    }

    if (options.hasSameValueOf) {
        if(value !== options.hasSameValueOf.value) {
            errors['PasswordNotMatch'] = true
        }
    }

        return Object.keys(errors).length > 0 ? errors : null;
}