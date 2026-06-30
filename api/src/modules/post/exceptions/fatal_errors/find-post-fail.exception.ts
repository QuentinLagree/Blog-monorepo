import { HttpStatus } from '@nestjs/common';
import { AppException } from 'src/commons/app.exception';

export class FindPostFailException extends AppException {
  constructor(error: Error) {
    super(
      `The publication failed during the search.`,
      `La publication a eu un echec lors de la recherche, réessayer ultérieurement ou contactez l'administration.`,
      error,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}