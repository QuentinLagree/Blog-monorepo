import { HttpStatus } from '@nestjs/common';
import { AppException } from 'src/commons/app.exception';

export class UserHaveAlreadyActiveSessionException extends AppException {
  constructor() {
    super(
      `User logged failed (already logged)`,
      `Tu es déjà connecté...`,
      null,
      HttpStatus.UNAUTHORIZED,
    );
  }
}