import { HttpStatus } from '@nestjs/common';
import { AppException } from 'src/commons/exceptions/app.exception';

export class EmailOrPasswordNotMatchException extends AppException {
  constructor() {
    super(
      `User logged failed`,
      `L'email ou le mot de passe sont incorrect.`,
      null,
      HttpStatus.UNAUTHORIZED,
    );
  }
}