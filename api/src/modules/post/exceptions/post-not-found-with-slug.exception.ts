import { HttpStatus } from '@nestjs/common';
import { AppException } from 'src/commons/app.exception';

export class PostNotFoundWithSlugException extends AppException {
  constructor(slug: string) {
    super(
      `Post Not Found with slug "${slug}"`,
      `La publication avec le slug : "${slug}", n'existe pas.`,
      null,
      HttpStatus.NOT_FOUND,
    );
  }
}