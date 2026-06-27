import { HttpStatus } from '@nestjs/common';
import { AppException } from 'src/commons/exceptions/app.exception';

export class UserNotHaveAuthorisation extends AppException {
  constructor() {
    super(
      `You dosn't have the authorisation`,
      `Vous n'avez pas l'autorisation d'accéder à cette ressource.`,
      null,
      HttpStatus.FORBIDDEN,
    );
  }
}