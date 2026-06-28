import { InputType } from "../../inputs/input.model";

export interface OptionalValidations {
  acceptSpecialCaracters?: boolean;
  hasValidEmail?: boolean;
}


export interface TextAreaValidationContext {
  value: string;
  required?: boolean;
  minlength?: number;
  maxlength?: number;
  validate?: boolean;
  type: InputType;
  options?: OptionalValidations;
}
