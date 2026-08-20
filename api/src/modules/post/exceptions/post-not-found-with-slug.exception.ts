import { HttpStatus } from '@nestjs/common';
import { ApiExceptionDocumentation, AppException } from 'src/commons/app.exception';

export class PostNotFoundWithSlugException extends AppException {
  
    static readonly status = HttpStatus.NOT_FOUND
  
    static readonly documentation = {
      description: "La publication demandé n'a pas été trouvé avec le slug.",
      messageExample: "La publication avec le slug : `\"titre-de-l-article-2\", n'existe pas."
    } satisfies ApiExceptionDocumentation
  constructor(slug: string) {
    super(
      `Post Not Found with slug "${slug}"`,
      `La publication avec le slug : "${slug}", n'existe pas.`,
      PostNotFoundWithSlugException.status,
    );
  }
}