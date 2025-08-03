import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";
import { InputValidationContext } from "../../models/input-validation-context.interface";
import { validateInput } from "src/app/shared/helpers/validation/input-validator.helper";

export function TextInputValidatorFactory(config: Omit<InputValidationContext, 'value' | 'type'> = {}): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        const context: InputValidationContext = {
            type: 'text',
            minlength: 4,
            required: true,
            value: (control.value || '').toString(),
            options: {
                acceptSpecialCaracters: false,
            },
            ...config,
        }

        return validateInput(context);
    }
}