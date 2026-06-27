import { HttpStatus } from '@nestjs/common';
import { AppException } from 'src/commons/exceptions/app.exception';

export class SlugInvalidFormat extends AppException {
  constructor(slug: string) {
    super(
      `Invalid slug ${slug}`,
      `Le paramètre : '${slug}' n'est pas valide.`,
      null,
      HttpStatus.BAD_REQUEST,
    );
  }
}