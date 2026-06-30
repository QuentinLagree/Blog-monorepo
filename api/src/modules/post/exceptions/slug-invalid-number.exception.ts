import { HttpStatus } from '@nestjs/common';
import { AppException } from 'src/commons/app.exception';

export class SlugInvalidNumber extends AppException {
  constructor(id: number) {
    super(
      `Invalid id ${id}`,
      `l'id : ${id} est invalide.`,
      null,
      HttpStatus.BAD_REQUEST,
    );
  }
}