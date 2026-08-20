import {
  applyDecorators,
  Type,
} from '@nestjs/common';

import {
  ApiExtraModels,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { ApiResponseDto } from '../types/dto/message/message';


type ApiMessageResponseOptions = {
  messageExemple?: string,
  status?: number;
  description?: string;
  isArray?: boolean;
  meta?: Type<unknown>;
};

export function ApiMessageResponse(
  model: Type<unknown> | null | [],
  options: ApiMessageResponseOptions = {},
) {
  const {
    status = 200,
    description,
    isArray = false,
    meta,
  } = options;

  const extraModels: Type<unknown>[] = [ApiResponseDto];

  if (model && !(model instanceof Array)) {
    extraModels.push(model);
  }

  if (meta) {
    extraModels.push(meta);
  }

  const dataSchema = !model
    ? {
        type: 'object',
        example: model,
        nullable: true,
        description: "Données ou message d'erreur envoyé avec la réponse de l'API."
      }
    : isArray
      ? {
          type: 'array',
        
          items: {
            $ref: getSchemaPath((model instanceof Array) ? () => {return []} : model),
          },
        }
      : {
          $ref: getSchemaPath((model instanceof Array) ? () => {return []} : model),
        };

  return applyDecorators(
    ApiExtraModels(...extraModels),

    ApiResponse({
      status,
      description,
      schema: {
        allOf: [
          {
            $ref: getSchemaPath(ApiResponseDto),
          },
          {
            properties: {
              message: {
                type: "string",
                example: options.messageExemple,
              },
              data: dataSchema,

              ...(meta && {
                meta: {
                  description: "Salut je suis une descritpion",
                  $ref: getSchemaPath(meta),
                },
              }),
            },
          },
        ],
      },
    }),
  );
}