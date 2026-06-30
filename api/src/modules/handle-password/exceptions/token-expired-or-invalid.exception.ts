// src/commons/exceptions/reset-token-already-active.exception.ts

import { HttpStatus } from '@nestjs/common';
import { AppException } from 'src/commons/app.exception';

export class TokenExpiredOrInvalidException extends AppException {
  constructor() {
    super(
      'Token is expired or invalid',
      'Le token est invalide ou expiré...',
      null,
      HttpStatus.CONFLICT,
    );
  }
}