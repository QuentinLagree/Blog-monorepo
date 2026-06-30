import { HttpStatus } from '@nestjs/common';
import { AppException } from 'src/commons/app.exception';

export class UpdatePostFailException extends AppException {
  constructor(error: Error) {
    super(
      `The publication failed during modification.`,
      `La publication a eu un echec lors de la modification, réessayer ultérieurement ou contactez l'administration.`,
      error,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}