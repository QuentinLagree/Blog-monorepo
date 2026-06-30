import { HttpStatus } from '@nestjs/common';
import { cpSync } from 'fs';
import { AppException } from 'src/commons/app.exception';

type Property = 'email' | 'pseudo'

export class UserAlreadyExistException extends AppException {
  constructor(property: Property) {
    super(
      `${property} already use.`,
      `${property} déjà utilisé, connectez-vous si c'est bien vous.`,
      null,
      HttpStatus.BAD_REQUEST,
    );
  }
}