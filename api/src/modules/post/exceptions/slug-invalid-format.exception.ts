import { HttpStatus } from '@nestjs/common';
import { ApiExceptionDocumentation, AppException } from 'src/commons/app.exception';

export class SlugInvalidFormat extends AppException {
  
  static readonly status = HttpStatus.BAD_REQUEST

  static readonly documentation = {
    description: "L'utilisateur demande un article avec un slug invalide.",
    messageExample: "Le paramètre : 'invalide_slug--d5' n'est pas valide."
  } satisfies ApiExceptionDocumentation
  constructor(slug: string) {
    super(
      `Invalid slug ${slug}`,
      `Le paramètre : '${slug}' n'est pas valide.`,
      SlugInvalidFormat.status
    );
  }
}