import { InputType } from "../../inputs/input.model";

export interface OptionalValidations {
  acceptSpecialCaracters?: boolean;
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
