import { HttpStatus } from '@nestjs/common';
import { ApiExceptionDocumentation, AppException } from 'src/commons/app.exception';

export class FindPostFailException extends AppException {

  static readonly status = HttpStatus.INTERNAL_SERVER_ERROR

  static readonly documentation = {
    description: "La recherche de la publication à fourni une erreur non gérée.",
    messageExample: "La publication a eu un echec lors de la recherche, réessayer ultérieurement ou contactez l'administration"
  } satisfies ApiExceptionDocumentation
  
  constructor(error: Error) {
    super(
      `The publication failed during the search.`,
      `La publication a eu un echec lors de la recherche, réessayer ultérieurement ou contactez l'administration.`,
      FindPostFailException.status,
      error
    );
  }
}