import { FormControl } from '@angular/forms';

export interface OptionalValidations {
  useStrengthCheck?: boolean;
  acceptSpecialCaracters?: boolean;
  hasValidEmail?: boolean;
  hasSameValueOf?: FormControl;
}
