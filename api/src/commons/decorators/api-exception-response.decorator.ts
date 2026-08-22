import { applyDecorators } from '@nestjs/common';
import { ApiMessageResponse } from './api-message-response.decorator';
import { DocumentedAppExceptionClass } from '../app.exception';
import { ApiResponse } from '@nestjs/swagger';

type ExceptionsDecoratorOptions = {
  properties_validator: boolean;
}

export function ApiExceptionsResponse(
  exceptions: DocumentedAppExceptionClass[],
  options: ExceptionsDecoratorOptions = { properties_validator: true }
) {
  const exceptionsDecorators = exceptions.map((exception) => {
    return ApiMessageResponse(null, {
      status: exception.status,
      description: exception.documentation.description,
      messageExemple: exception.documentation.messageExample,
    });
  });

  return applyDecorators(
    (options.properties_validator) ? ApiMessageResponse(null, {
      status: 400,
      description: "Cette erreur est déclanché lorsque un ou plusieurs paramètres ne sont pas valides.",
      messageExemple: "Un ou plusieurs paramètres fournis ne respectent pas les contraintes de validation."
    }) : () => {},
    ...exceptionsDecorators,
    ApiMessageResponse(null, {
      status: 500,
      description: 'Une erreur non gérée est survenue.',
      messageExemple:
        'Une erreur interne est survenue, réessayez plus tard ou contactez un administrateur.',
    }),
  );
}