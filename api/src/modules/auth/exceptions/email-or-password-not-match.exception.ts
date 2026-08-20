import { HttpStatus } from '@nestjs/common';
import { ApiExceptionDocumentation, AppException } from 'src/commons/app.exception';

export class EmailOrPasswordNotMatchException extends AppException {

  static readonly status = HttpStatus.UNAUTHORIZED
  static readonly documentation = {
    description: "L'utilisateurn n'a pas fournis les bon identifiants.",
    messageExample: "L'email ou le mot de passe sont incorrect."
  } satisfies ApiExceptionDocumentation
  constructor() {
    super(
      `User logged failed`,
      `L'email ou le mot de passe sont incorrect.`,
      EmailOrPasswordNotMatchException.status
    );
  }
}