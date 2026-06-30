import { HttpStatus } from '@nestjs/common';
import { AppException } from 'src/commons/app.exception';

export class UserAlreadySessionActive extends AppException {
  constructor() {
    super(
      `User Session already exist`,
      `Votre session est déjà active.`,
      null,
      HttpStatus.UNAUTHORIZED,
    );
  }
}