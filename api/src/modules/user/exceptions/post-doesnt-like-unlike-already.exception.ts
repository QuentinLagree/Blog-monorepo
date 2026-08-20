import { HttpStatus } from '@nestjs/common';
import { ApiExceptionDocumentation, AppException } from 'src/commons/app.exception';

export class PostDoesntLikeOrUnlikeAlready extends AppException {
  static readonly status = HttpStatus.CONFLICT

  static readonly documentation = {
    description: "Si l'utilisateur effectue une action qui déjà faites (par exemple liker un poste qui est déjà liker ou inversement).",
    messageExample: "Tu ne peux pas like une publication que tu as déjà like ou inversement."
  } satisfies ApiExceptionDocumentation
  constructor() {
    super(
      `Like or unlike.`,
      `Tu ne peux pas like une publication que tu as déjà like ou inversement.`,
      PostDoesntLikeOrUnlikeAlready.status
    );
  }
}