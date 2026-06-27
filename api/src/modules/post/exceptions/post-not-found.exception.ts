import { HttpStatus } from '@nestjs/common';
import { AppException } from 'src/commons/exceptions/app.exception';

export class PostNotFoundException extends AppException {
  constructor(id: any) {
    super(
      `Post Not Found with id ${id}`,
      `La publication ${id} n'existe pas.`,
      null,
      HttpStatus.NOT_FOUND,
    );
  }
}