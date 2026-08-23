import { HttpStatus } from '@nestjs/common';
import { ApiExceptionDocumentation, AppException } from 'src/commons/app.exception';

export class CreatePostFailException extends AppException {

  static readonly status = HttpStatus.INTERNAL_SERVER_ERROR

  static readonly documentation = {
    description: "La création d'un article à eu une erreur non gérée.",
    messageExample: "La publication a eu un echec lors de sa création, réessayer ultérieurement ou contactez l'administration."
  } satisfies ApiExceptionDocumentation
  
  constructor(error: Error) {
    super(
      `The publication failed during creation.`,
      `La publication a eu un echec lors de sa création, réessayer ultérieurement ou contactez l'administration.`,
      CreatePostFailException.status,
      error,
    );
  }
}