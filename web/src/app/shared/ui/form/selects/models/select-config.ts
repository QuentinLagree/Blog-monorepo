import { InputConfig } from '../../inputs/models/input-config.model';

export interface SelectConfig extends Omit<InputConfig, 'minLength' | 'maxLength'> {
  default_choice: string;
  choices: string[];
  multiple: boolean;
}
