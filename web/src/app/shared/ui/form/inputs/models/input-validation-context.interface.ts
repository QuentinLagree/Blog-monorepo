import { InputType } from '../input.model';
import { OptionalValidations } from './optional-input-validation-context.interface';

export interface InputValidationContext {
  value: string;
  required?: boolean;
  minlength?: number;
  maxlength?: number;
  validate?: boolean;
  type: InputType;
  options?: OptionalValidations;
}
