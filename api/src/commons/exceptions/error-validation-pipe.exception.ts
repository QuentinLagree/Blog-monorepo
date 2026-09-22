import { HttpStatus } from '@nestjs/common';
import { ApiExceptionDocumentation, AppException } from 'src/commons/app.exception';
import { MessageValidationError } from '../types/dto/message/validation-error-message';

export class ErrorValidationPipeException extends AppException {

  static readonly status = HttpStatus.BAD_REQUEST

  static readonly documentation = {
    description: "La création d'un article à eu une erreur non gérée.",
    messageExample: "La publication a eu un échec lors de sa création, réessayer ultérieurement ou contactez l'administration."
  } satisfies ApiExceptionDocumentation
  
  constructor(validationErrors: MessageValidationError[]) {
    super(
      `La publication a eu un échec lors de sa création, réessayer ultérieurement ou contactez l'administration.`,
      ErrorValidationPipeException.status,
      validationErrors
    );
  }
}