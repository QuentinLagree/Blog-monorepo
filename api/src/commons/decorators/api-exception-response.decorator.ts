import { applyDecorators } from '@nestjs/common';

import {
  ApiExtraModels,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';

import { ApiMessageResponse } from './api-message-response.decorator';

import { DocumentedAppExceptionClass } from '../app.exception';

import { groupByExceptions as groupExceptionsByStatus } from '../utils/group-by-exceptions.utils';

import { StatusCodeDescriptionEnum } from '../utils/status_code-description.enum';

import { ApiResponseDto } from '../types/dto/message/message';


import { getDtoPropertyPriority } from '../types/dto/temp/metadata';

import { buildValidationMessages } from '../types/dto/temp/message-validator-builder';
import { MessageValidationError } from '../types/dto/message/validation-error-message';


type DtoClass = new (...args: any[]) => object;


type ExceptionsDecoratorOptions = {
  properties_validator: boolean;
  dto?: DtoClass;
};


type ExceptionExample = {
  description: string;

  value: {
    message: string;
    data: null | MessageValidationError[];
  };
};


export function ApiExceptionsResponse(
  exceptions: DocumentedAppExceptionClass[],
  options: ExceptionsDecoratorOptions = {
    properties_validator: true,
  },
) {
  /*
   * Validation des propriétés du DTO
   */
  let validationProperties: MessageValidationError[] = [];

  if (options.properties_validator && options.dto) {
    const properties = getDtoPropertyPriority(options.dto) as Record<string, any>;

    validationProperties = buildValidationMessages(properties as any);
  }


  const globalExceptions: Array<{
    status: number;

    documentation: {
      description: string;
      messageExample: string;
    };

    data?: MessageValidationError[];
  }> = [
    {
      status: 500,

      documentation: {
        description: 'Une erreur non gérée est survenue.',

        messageExample:
          'Une erreur interne est survenue, réessayez plus tard ou contactez un administrateur.',
      },
    },

    ...(options.properties_validator && options.dto
      ? [
          {
            status: 400,

            documentation: {
              description:
                'Un ou plusieurs paramètres ne sont pas valides.',

              messageExample:
                'Un ou plusieurs paramètres ne sont pas valides.',
            },

            data: validationProperties,
          },
        ]
      : []),
  ];


  /**
   * Récupérer les erreurs en fonction de leur status (Fait)
   *
   * Créer un dictionnaire de
   * status code -> description globale (Fait)
   *
   * Si le tableau n'a qu'une seule erreur :
   * créer un ApiMessageResponse classique
   *
   * Sinon créer un ApiResponse avec examples
   * et mettre chaque erreur dans un example.
   */


  const allExceptions = Array.from(exceptions).concat(
    globalExceptions as unknown as DocumentedAppExceptionClass[],
  );


  const responseDecorators = Object.entries(
    groupExceptionsByStatus(allExceptions, 'status'),
  ).map(([statusValue, exceptionClasses]) => {
    const status = Number(statusValue);


    /*
     * Si une seule exception existe pour ce status
     */
    if (exceptionClasses.length === 1) {
      const exceptionClass = exceptionClasses[0];


      /*
       * Cas particulier :
       * ValidationError générée depuis le DTO
       */
      if (
        status === 400 &&
        options.properties_validator &&
        options.dto
      ) {
        return ApiResponse({
          status,

          description:
            exceptionClass.documentation.description,

          content: {
            'application/json': {
              schema: {
                $ref: getSchemaPath(ApiResponseDto),
              },

              example: {
                message:
                  exceptionClass.documentation.messageExample,

                data: validationProperties,
              },
            },
          },
        });
      }


      /*
       * Réponse classique
       */
      return ApiMessageResponse(null, {
        status,

        description:
          exceptionClass.documentation.description,

        messageExemple:
          exceptionClass.documentation.messageExample,
      });
    }


    /*
     * Plusieurs exceptions possèdent le même status
     */
    const examples: Record<string, ExceptionExample> = {};


    exceptionClasses.forEach((exceptionClass) => {
      const isValidationException =
        status === 400 &&
        exceptionClass.documentation.description ===
          'Un ou plusieurs paramètres ne sont pas valides.';


      examples[
        exceptionClass.documentation.description
      ] = {
        description:
          exceptionClass.documentation.description,

        value: {
          message:
            exceptionClass.documentation.messageExample,

          data: isValidationException
            ? validationProperties
            : null,
        },
      };
    });


    return ApiResponse({
      status,

      description:
        StatusCodeDescriptionEnum[status],

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
    ApiExtraModels(
      ApiResponseDto,
      MessageValidationError,
    ),

    ...responseDecorators,
  );
}