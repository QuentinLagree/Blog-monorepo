import { HttpStatus } from '@nestjs/common';
import { ApiExceptionDocumentation, AppException } from 'src/commons/app.exception';

export class UnauthorizedSessionInactive extends AppException {
  static readonly status = HttpStatus.UNAUTHORIZED

  static readonly documentation = {
    description: "L'utilisateur n'est pas connecté pour accéder à une ressource.",
    messageExample: "Il faut être connecté pour accéder à cette ressource."
  } satisfies ApiExceptionDocumentation
  constructor() {
    super(
      `User Session is inactive`,
      `Il faut être connecté pour accéder à cette ressource.`,
      UnauthorizedSessionInactive.status
    );
  }
}