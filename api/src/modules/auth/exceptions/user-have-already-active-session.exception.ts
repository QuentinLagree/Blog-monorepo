import { HttpStatus } from '@nestjs/common';
import { ApiExceptionDocumentation, AppException } from 'src/commons/app.exception';

export class UserHaveAlreadyActiveSessionException extends AppException {

  static readonly status = HttpStatus.UNAUTHORIZED
  
  static readonly documentation = {
    description: "L'utilisateur essaie de se connecter mais, celui ci est déjà connecté.",
    messageExample:"Tu es déjà conntecté..."
  } satisfies ApiExceptionDocumentation
  
  constructor() {
    super(
      `User logged failed (already logged)`,
      `Tu es déjà connecté...`,
      UserHaveAlreadyActiveSessionException.status,
    );
  }
}