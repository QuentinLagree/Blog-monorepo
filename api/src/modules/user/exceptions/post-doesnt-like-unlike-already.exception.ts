import { HttpStatus } from '@nestjs/common';
import { cpSync } from 'fs';
import { AppException } from 'src/commons/app.exception';

export class PostDoesntLikeOrUnlikeAlready extends AppException {
  constructor() {
    super(
      `Like or unlike.`,
      `Tu ne peux pas like une publication que tu as déjà like ou inversement.`,
      null,
      HttpStatus.CONFLICT,
    );
  }
}