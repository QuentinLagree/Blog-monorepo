import { InputType } from '../input.model';

export interface InputConfig {
  label: string;
  placeholder: string;
  type: InputType;
  required: boolean;
  minLength?: number;
  maxLength?: number;
}
