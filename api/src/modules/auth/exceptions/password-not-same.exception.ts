import { HttpStatus } from '@nestjs/common';
import { AppException } from 'src/commons/app.exception';

export class PasswordNotMatchException extends AppException {
  constructor() {
    super(
      `User logged failed (password not same)`,
      `Les deux mots de passe doivent correspondre...`,
      null,
      HttpStatus.UNAUTHORIZED,
    );
  }
}