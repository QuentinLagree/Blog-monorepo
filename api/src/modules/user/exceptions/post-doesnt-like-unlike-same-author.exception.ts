import { HttpStatus } from '@nestjs/common';
import { cpSync } from 'fs';
import { AppException } from 'src/commons/app.exception';

export class PostDoesntLikeOrUnlikeByAuthor extends AppException {
  constructor() {
    super(
      `Author can't like or unlike post.`,
      `L'auteur de l'article ne peux pas like ou unlike un article.`,
      null,
      HttpStatus.CONFLICT,
    );
  }
}