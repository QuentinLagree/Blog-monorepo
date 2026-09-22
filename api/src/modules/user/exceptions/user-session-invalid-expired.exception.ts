import { HttpStatus } from "@nestjs/common";
import { ApiExceptionDocumentation, AppException } from "src/commons/app.exception";

export class UserSessionInvalidException extends AppException {

    static readonly status = HttpStatus.UNAUTHORIZED

    static readonly documentation = {
        description: "La session de l'utilisateur à expirer ou est invalide.",
        messageExample: "Ta session a expiré, re-connecte toi."
    } satisfies ApiExceptionDocumentation;

    constructor() {
        super(
            'Ta session a expiré, re-connecte toi.',
            UserSessionInvalidException.status
        )
    }

}