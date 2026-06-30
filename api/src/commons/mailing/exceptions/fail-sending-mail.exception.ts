import { HttpStatus } from "@nestjs/common";
import { AppException } from "src/commons/app.exception";

export class FailSendingMailException extends AppException {
    constructor() {
        super(
          `Mail sending failed`,
          `Une erreur est survenue lors de l'envoie du mail. Réesayer ultérieurement.`,
          null,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
}