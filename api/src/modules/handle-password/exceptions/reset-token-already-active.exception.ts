// src/commons/exceptions/reset-token-already-active.exception.ts 

import { HttpStatus } from '@nestjs/common';
import { ApiExceptionDocumentation, AppException } from 'src/commons/app.exception';

export class ResetTokenAlreadyActiveException extends AppException {
   
  static readonly status = HttpStatus.CONFLICT

  static readonly documentation = {
    description: "L'utilisateur refais une demande de changement de mot de passe, mais n'avait pas encore fini l'ancienne demande.",
    messageExample: "Une demande de réinitialisation est déjà active. Veuillez vérifier vos emails ou réessayer plus tard."
  } satisfies ApiExceptionDocumentation
  constructor() {
    super(
      'Reset token already active',
      'Une demande de réinitialisation est déjà active. Veuillez vérifier vos emails ou réessayer plus tard.',
      ResetTokenAlreadyActiveException.status,
    );
  }
}