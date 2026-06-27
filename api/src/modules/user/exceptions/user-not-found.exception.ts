import { HttpStatus } from '@nestjs/common';
import { AppException } from 'src/commons/exceptions/app.exception';

export class UserNotFoundException extends AppException {
  constructor(uniqueProperties: any) {
    super(
      `User Not Found with ${uniqueProperties}`,
      `l'utilisateur : ${uniqueProperties} n'existe pas.`,
      null,
      HttpStatus.NOT_FOUND,
    );
  }
}