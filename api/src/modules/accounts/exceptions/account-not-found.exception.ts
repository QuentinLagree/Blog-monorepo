import { HttpStatus } from '@nestjs/common';
import { AppException } from 'src/commons/app.exception';

export class AccountNotFoundException extends AppException {
  constructor(uniqueProperties: any) {
    super(
      `Account Not Found with ${uniqueProperties}`,
      `le compte utilisateur : ${uniqueProperties} n'existe pas.`,
      null,
      HttpStatus.NOT_FOUND,
    );
  }
}