import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";
import { InputValidationContext } from "../../models/input-validation-context.interface";
import { validateInput } from "src/app/shared/helpers/validation/input-validator.helper";

export function EmailInputValidatorFactory(config: Omit<InputValidationContext, 'value' | 'type'> = {}): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        const context: InputValidationContext = {
            type: 'email',
            value: (control.value || '').toString(),
            required: true,
            minlength: 5,
            options: {
                hasValidEmail: true
            },
            ...config,
        }
        return validateInput(context);
    }
}