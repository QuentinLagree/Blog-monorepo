import { HttpStatus } from "@nestjs/common";
import { AppException } from "src/commons/app.exception";

export class PostAlreadyPublishException extends AppException {
    constructor() {
    super(
      `Post Publish fail`,
      `La publication est déjà publié, si vous n'êtes pas à l'origine de cette action, contactez immédiatement l'aministrateur.`,
      null,
      HttpStatus.BAD_REQUEST,
    );
  }
}