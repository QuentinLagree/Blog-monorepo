import { ButtonSize } from '../../buttons/base-button';
import { InputType } from '../input.model';

export interface InputConfig {
  label: string;
  placeholder: string;
  type: InputType;
  size?: 'sm' | 'md' | 'lg',
  hint?: string;
  required: boolean;
  minLength?: number;
  maxLength?: number;
}
