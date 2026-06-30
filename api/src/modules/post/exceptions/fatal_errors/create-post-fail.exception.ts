import { HttpStatus } from '@nestjs/common';
import { AppException } from 'src/commons/app.exception';

export class CreatePostFailException extends AppException {
  constructor(error: Error) {
    super(
      `The publication failed during creation.`,
      `La publication a eu un echec lors de la création, réessayer ultérieurement ou contactez l'administration.`,
      error,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}