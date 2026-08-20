import { HttpStatus } from "@nestjs/common";
import { ApiExceptionDocumentation, AppException } from "src/commons/app.exception";

export class FailSendingMailException extends AppException {
  
  static readonly status = HttpStatus.INTERNAL_SERVER_ERROR

  static readonly documentation = {
    description: "L'envoie du mail a créer une erreur non gérée.",
    messageExample: "Une erreur est survenue lors de l'envoie du mail. Réesayer ultérieurement."
  } satisfies ApiExceptionDocumentation
    constructor() {
        super(
          `Mail sending failed`,
          `Une erreur est survenue lors de l'envoie du mail. Réesayer ultérieurement.`,
          FailSendingMailException.status,
        );
      }
}