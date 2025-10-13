import { InputType } from '../../inputs/input.model';

export interface SelectValidationContext {
  value: string;
  required?: boolean;
  type: InputType;
  validate?: boolean,
  maxlength?: number,
}
