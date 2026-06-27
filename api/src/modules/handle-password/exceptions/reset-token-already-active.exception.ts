// src/commons/exceptions/reset-token-already-active.exception.ts

import { HttpStatus } from '@nestjs/common';
import { AppException } from 'src/commons/exceptions/app.exception';

export class ResetTokenAlreadyActiveException extends AppException {
  constructor() {
    super(
      'Reset token already active',
      'Une demande de réinitialisation est déjà active. Veuillez vérifier vos emails ou réessayer plus tard.',
      null,
      HttpStatus.CONFLICT,
    );
  }
}