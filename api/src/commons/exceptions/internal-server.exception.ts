import { HttpStatus } from '@nestjs/common';
import { ApiExceptionDocumentation, AppException } from 'src/commons/app.exception';

export class InternalServerException extends AppException {

    static readonly status = HttpStatus.INTERNAL_SERVER_ERROR

    static readonly documentation = {
        description: "Une erreur interne est survenue.",
        messageExample: "Une erreur interne est survenue, réessayer ultérieurement ou contactez l'administration."
    } satisfies ApiExceptionDocumentation

    constructor() {
        super(
            `Une erreur interne est survenue, réessayer ultérieurement ou contactez l'administration.`,
            InternalServerException.status,
        );
    }
}