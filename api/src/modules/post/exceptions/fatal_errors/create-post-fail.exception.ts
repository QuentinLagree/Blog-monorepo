import { HttpStatus } from '@nestjs/common';
import { AppException } from 'src/commons/app.exception';

export class CreatePostFailException extends AppException {

  static readonly status = HttpStatus.INTERNAL_SERVER_ERROR
  
  constructor(error: Error) {
    super(
      `The publication failed during creation.`,
      `La publication a eu un echec lors de la création, réessayer ultérieurement ou contactez l'administration.`,
      HttpStatus.INTERNAL_SERVER_ERROR,
      error,
    );
  }
}