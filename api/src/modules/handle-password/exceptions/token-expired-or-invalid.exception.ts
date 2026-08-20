import { HttpStatus } from '@nestjs/common';
import { ApiExceptionDocumentation, AppException } from 'src/commons/app.exception';

export class TokenExpiredOrInvalidException extends AppException {
  
  static readonly status = HttpStatus.CONFLICT

  static readonly documentation = {
    description: "L'utilisateur a essayer de récupérer une ressource avec un token mais celui-ci est invalide ou expiré.",
    messageExample: "Le token est invalide ou expiré..."
  } satisfies ApiExceptionDocumentation
  
  constructor() {
    super(
      'Token is expired or invalid',
      'Le token est invalide ou expiré...',
      TokenExpiredOrInvalidException.status,
    );
  }
}