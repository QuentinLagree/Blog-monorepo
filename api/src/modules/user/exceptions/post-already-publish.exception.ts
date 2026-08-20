import { HttpStatus } from "@nestjs/common";
import { ApiExceptionDocumentation, AppException } from "src/commons/app.exception";

export class PostAlreadyPublishException extends AppException {

  static readonly status = HttpStatus.BAD_REQUEST

  static readonly documentation = {
    description: "L'utilisateur a déjà publié un article.",
    messageExample: "La publication est déjà publié, si vous n'êtes pas à l'origine de cette action, contactez immédiatement l'aministrateur."
  } satisfies ApiExceptionDocumentation
    constructor() {
    super(
      `Post Publish fail`,
      `La publication est déjà publié, si vous n'êtes pas à l'origine de cette action, contactez immédiatement l'aministrateur.`,
      PostAlreadyPublishException.status
    );
  }
}