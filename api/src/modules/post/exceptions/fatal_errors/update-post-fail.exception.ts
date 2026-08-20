import { HttpStatus } from '@nestjs/common';
import { ApiExceptionDocumentation, AppException } from 'src/commons/app.exception';

export class UpdatePostFailException extends AppException {
  
  static readonly status = HttpStatus.INTERNAL_SERVER_ERROR

  static readonly documentation = {
    description: "La modification d'un article à eu une erreur non gérée.",
    messageExample: "La publication a eu un echec lors de la modification, réessayer ultérieurement ou contactez l'administration."
  } satisfies ApiExceptionDocumentation
  constructor(error: Error) {
    super(
      `The publication failed during modification.`,
      `La publication a eu un echec lors de la modification, réessayer ultérieurement ou contactez l'administration.`,
      UpdatePostFailException.status,
      error,
    );
  }
}