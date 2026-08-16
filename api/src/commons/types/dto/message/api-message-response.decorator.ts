import {
  applyDecorators,
  Type,
} from '@nestjs/common';

import {
  ApiExtraModels,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { MessageDto } from './message';


type ApiMessageResponseOptions = {
  messageExemple?: string,
  status?: number;
  description?: string;
  isArray?: boolean;
  meta?: Type<unknown>;
};

export function ApiMessageResponse(
  model: Type<unknown> | null,
  options: ApiMessageResponseOptions = {},
) {
  const {
    status = 200,
    description,
    isArray = false,
    meta,
  } = options;

  const extraModels: Type<unknown>[] = [MessageDto];

  if (model) {
    extraModels.push(model);
  }

  if (meta) {
    extraModels.push(meta);
  }

  const dataSchema = !model
    ? {
        type: 'object',
        nullable: true,
        example: null,
      }
    : isArray
      ? {
          type: 'array',
          items: {
            $ref: getSchemaPath(model),
          },
        }
      : {
          $ref: getSchemaPath(model),
        };

  return applyDecorators(
    ApiExtraModels(...extraModels),

    ApiResponse({
      status,
      description,
      schema: {
        allOf: [
          {
            $ref: getSchemaPath(MessageDto),
          },
          {
            properties: {
              message: {
                type: "string",
                example: options.messageExemple
              },
              data: dataSchema,

              ...(meta && {
                meta: {
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