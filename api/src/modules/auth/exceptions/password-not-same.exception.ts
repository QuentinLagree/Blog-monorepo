import { HttpStatus } from '@nestjs/common';
import { ApiExceptionDocumentation, AppException } from 'src/commons/app.exception';

export class PasswordNotMatchException extends AppException {
  
  static readonly status = HttpStatus.UNAUTHORIZED

  static readonly documentation = {
    description: "L'utilisateur a saisi le mot de passe et le mot de passe de confirmation qui ne correspondent pas.",
    messageExample: `Les deux mots de passe doivent correspondre...`
  } satisfies ApiExceptionDocumentation
  constructor() {
    super(
      `User logged failed (password not same)`,
      `Les deux mots de passe doivent correspondre...`,
      PasswordNotMatchException.status
    );
  }
}