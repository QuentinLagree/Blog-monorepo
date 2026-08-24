import { HttpStatus } from '@nestjs/common';
import { ApiExceptionDocumentation, AppException } from 'src/commons/app.exception';

export class TokenInvalidFormat extends AppException {
  
  static readonly status = HttpStatus.BAD_REQUEST

  static readonly documentation = {
    description: "L'utilisateur a fait passé en paramètre un Token invalide, il doit correspondre à un certain format.",
    messageExample: "Le token a un format invalide, il faut qu'il ai un format héxadécimal."
  } satisfies ApiExceptionDocumentation
  
  constructor() {
    super(
      'Token is invalid format',
      'Le token a un format invalide, il faut qu\'il ai un format héxadécimal.',
      TokenInvalidFormat.status,
    );
  }
}