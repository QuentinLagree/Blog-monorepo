import { HttpStatus } from '@nestjs/common';
import { ApiExceptionDocumentation, AppException } from 'src/commons/app.exception';

export class PostNotFoundException extends AppException {
  static readonly status = HttpStatus.NOT_FOUND

  static readonly description = {
     description: "La publication demandé est introuvable.",
     messageExample: "La publication 137 n'existe pas"
  } satisfies ApiExceptionDocumentation
  
  constructor(id: number) {
    super(
      `Post Not Found with id ${id}`,
      `La publication ${id} n'existe pas.`,
      PostNotFoundException.status,
    );
  }
}