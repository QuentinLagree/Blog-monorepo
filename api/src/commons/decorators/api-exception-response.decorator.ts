import { applyDecorators } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';

import { ApiMessageResponse } from './api-message-response.decorator';
import { DocumentedAppExceptionClass } from '../app.exception';
import { groupByExceptions as groupExceptionsByStatus } from '../utils/group-by-exceptions.utils';
import { StatusCodeDescriptionEnum } from '../utils/status_code-description.enum';
import { ApiResponseDto } from '../types/dto/message/message';

type ExceptionsDecoratorOptions = {
  properties_validator: boolean;
};

type ExceptionExample = {
  description: string;
  value: {
    message: string;
    data: null;
  };
};

export function ApiExceptionsResponse(
  exceptions: DocumentedAppExceptionClass[],
  options: ExceptionsDecoratorOptions = { properties_validator: true },
) {

  const globalExceptions: Array<{
    status: number;
    documentation: {
      description: string;
      messageExample: string;
    };
  }> = [
    {
      status: 500,
      documentation: {
        description: 'Une erreur non gérée est survenue.',
        messageExample:
          'Une erreur interne est survenue, réessayez plus tard ou contactez un administrateur.',
      },
    },

    ...(options.properties_validator
      ? [
        {
          status: 400,
          documentation: {
            description:
              'Un ou plusieurs paramètres ne sont pas valides.',
            messageExample:
              'Un ou plusieurs paramètres fournis ne respectent pas les contraintes de validation.',
          },
        },
      ]
      : []),
  ];
  /**
   * Récupérer les erreurs en fonction de leur status (Fait)
   * Créer un dictionnaire de (status code -> description globale) (Fait)
   * Si le tableau n'a qu'une seule erreur : créer un ApiMessageResponse classique
   * Sinon créer un ApiResponse avec examples et mettre chaque erreur dans un example.
   */

  const allExceptions = Array.from(exceptions).concat(
    globalExceptions as unknown as DocumentedAppExceptionClass[],
  );

  const responseDecorators = Object.entries(
    groupExceptionsByStatus(allExceptions, 'status'),
  ).map(([statusValue, exceptionClasses]) => {
    const status = Number(statusValue);

    if (exceptionClasses.length === 1) {
      const exceptionClass = exceptionClasses[0];

      return ApiMessageResponse(null, {
        status,
        description: exceptionClass.documentation.description,
        messageExemple: exceptionClass.documentation.messageExample,
      });
    }

    const examples: Record<string, ExceptionExample> = {};

    exceptionClasses.forEach((exceptionClass) => {
      examples[exceptionClass.documentation.description] = {
        description: exceptionClass.documentation.description,
        value: {
          message: exceptionClass.documentation.messageExample,
          data: null,
        },
      };
    });

    return ApiResponse({
      status,
      description: StatusCodeDescriptionEnum[status],
      content: {
        'application/json': {
          schema: {
            $ref: getSchemaPath(ApiResponseDto),
          },
          examples,
        },
      },
    });
  });

  return applyDecorators(
    ApiExtraModels(ApiResponseDto),
    ...responseDecorators,
  );
};