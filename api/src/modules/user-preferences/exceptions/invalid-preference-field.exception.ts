import { BadRequestException, HttpStatus } from '@nestjs/common';
import { ApiExceptionDocumentation, AppException } from 'src/commons/app.exception';
import { makeMessage } from 'src/commons/logger/logger.helper';

export class InvalidPreferenceFieldException extends AppException {
  static readonly status = HttpStatus.BAD_REQUEST;
  static readonly documentation = {
      description: "Les préférences demandés sont inexistantes.",
      messageExample: "Les préférences suivantes n'existent pas : 'orientation', 'color'. Contactez un administrateur pour obtenir de l'aide."
    } satisfies ApiExceptionDocumentation
  
  constructor(fields: string[]) {
    super(
        'Invalid preference fields',
        fields.length === 1
          ? `La préférence "${fields[0]}" n'existe pas.`
          : `Les préférences suivantes n'existent pas : ${fields.join(', ')}. Contactez un administrateur pour obtenir de l'aide.`,
          InvalidPreferenceFieldException.status,
    );
  }
}