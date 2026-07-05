import { HttpStatus } from '@nestjs/common';
import { AppException } from 'src/commons/app.exception';

export class UnauthorizedSessionInactive extends AppException {
  constructor() {
    super(
      `User Session is inactive`,
      `Il faut être connecté pour accéder à cette ressource.`,
      null,
      HttpStatus.UNAUTHORIZED,
    );
  }
}