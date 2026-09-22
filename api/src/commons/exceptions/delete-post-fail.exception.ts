import { HttpStatus } from '@nestjs/common';
import { ApiExceptionDocumentation, AppException } from 'src/commons/app.exception';

export class DeletePostFailException extends AppException {

  static readonly status = HttpStatus.INTERNAL_SERVER_ERROR

  static readonly documentation = {
    description: "La suppression d'un article à eu une erreur non gérée.",
    messageExample: "La publication a eu un échec lors de la suppression, réessayer ultérieurement ou contactez l'administration."
  } satisfies ApiExceptionDocumentation
  
  constructor() {
    super(
      `La publication a eu un échec lors de la suppression, réessayer ultérieurement ou contactez l'administration.`,
      DeletePostFailException.status,
    );
  }
}