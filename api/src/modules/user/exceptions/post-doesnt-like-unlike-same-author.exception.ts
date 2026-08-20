import { HttpStatus } from '@nestjs/common';
import { cpSync } from 'fs';
import { ApiExceptionDocumentation, AppException } from 'src/commons/app.exception';

export class PostDoesntLikeOrUnlikeByAuthor extends AppException {

  static readonly status = HttpStatus.CONFLICT

  static readonly documentation = {
    description: "L'auteur à effectué une action de like ou d'unlike sur sa propre publication.",
    messageExample: "L'auteur ne peux pas like ou unlike son propre article."
  } satisfies ApiExceptionDocumentation
  constructor() {
    super(
      `Author can't like or unlike post.`,
      `L'auteur ne peux pas like ou unlike son propre article.`,
      PostDoesntLikeOrUnlikeByAuthor.status,
    );
  }
}