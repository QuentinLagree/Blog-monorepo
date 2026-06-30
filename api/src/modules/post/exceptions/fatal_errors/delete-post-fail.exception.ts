import { HttpStatus } from '@nestjs/common';
import { AppException } from 'src/commons/app.exception';

export class DeletePostFailException extends AppException {
  constructor(error: Error) {
    super(
      `The publication failed during deletion.`,
      `La publication a eu un echec lors de la suppression, réessayer ultérieurement ou contactez l'administration.`,
      error,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}