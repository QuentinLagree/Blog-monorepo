import { HttpStatus } from '@nestjs/common';
import { ApiExceptionDocumentation, AppException } from 'src/commons/app.exception';

export class UserNotFoundException extends AppException {
  static readonly status = HttpStatus.NOT_FOUND;

  static readonly documentation = {
    description: "L'utilisateur demandé est introuvable.",
    messageExample: "L'utilisateur 42 n'existe pas."
  } satisfies ApiExceptionDocumentation
  constructor(identifier: string | number) {
    super(
      `User Not Found with ${identifier}`,
      `l'utilisateur : ${identifier} n'existe pas.`,
      UserNotFoundException.status
    );
  }
}