import { HttpStatus } from "@nestjs/common";
import { ApiExceptionDocumentation, AppException } from "src/commons/app.exception";

export class FailSendingMailException extends AppException {
  
  static readonly status = HttpStatus.INTERNAL_SERVER_ERROR

  static readonly documentation = {
    description: "L'envoie du mail a créer une erreur non gérée et donc n'est pas envoyé.",
    messageExample: "Une erreur est survenue lors de l'envoie du mail. celui ci n'est donc pas envoyé. Réesayer ultérieurement."
  } satisfies ApiExceptionDocumentation
    constructor() {
        super(
          `Mail sending failed`,
          `Une erreur est survenue lors de l'envoie du mail. celui ci n'est donc pas envoyé. Réesayer ultérieurement.`,
          FailSendingMailException.status,
        );
      }
}