import { InputConfig } from '../../inputs/models/input-config.model';

export interface SelectConfig extends Omit<InputConfig, 'minLength' | 'maxLength'> {
  choices: string[];
}
