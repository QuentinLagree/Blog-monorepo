import { HttpStatus } from '@nestjs/common';
import { ApiExceptionDocumentation, AppException } from 'src/commons/app.exception';

export class UserNotHaveAuthorisation extends AppException {

  static readonly status = HttpStatus.FORBIDDEN

  static readonly documentation = {
    description: "L'utilisateur n'a pas l'autorisation d'accéder à la ressource.",
    messageExample: "Vous n'avez pas l'autorisation d'accéder à cette ressource."
  } satisfies ApiExceptionDocumentation
  constructor() {
    super(
      `You dosn't have the authorisation`,
      `Vous n'avez pas l'autorisation d'accéder à cette ressource.`,
      UserNotHaveAuthorisation.status
    );
  }
}