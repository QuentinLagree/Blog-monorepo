import { applyDecorators } from '@nestjs/common';
import { ApiMessageResponse } from './api-message-response.decorator';
import { DocumentedAppExceptionClass } from '../app.exception';

export function ApiExceptionsResponse(
  exceptions: DocumentedAppExceptionClass[],
) {
  const exceptionsDecorators = exceptions.map((exception) => {
    return ApiMessageResponse(null, {
      status: exception.status,
      description: exception.documentation.description,
      messageExemple: exception.documentation.messageExample,
    });
  });

  return applyDecorators(
    ...exceptionsDecorators,
    ApiMessageResponse(null, {
      status: 500,
      description: 'Une erreur non gérée est survenue.',
      messageExemple:
        'Une erreur interne est survenue, réessayez plus tard ou contactez un administrateur.',
    }),
  );
}