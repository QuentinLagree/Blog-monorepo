import { InputType } from '../../input.model';

export type InputPasswordType = Extract<InputType, 'password' | 'text'>;
