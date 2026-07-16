import { BadRequestException } from '@nestjs/common';
import { makeMessage } from 'src/commons/logger/logger.helper';

export class InvalidPreferenceFieldException extends BadRequestException {
  constructor(fields: string[]) {
    super(
      makeMessage(
        'Invalid preference fields',
        fields.length === 1
          ? `La préférence "${fields[0]}" n'existe pas.`
          : `Les préférences suivantes n'existent pas : ${fields.join(', ')}.`,
        {
          invalidFields: fields,
        },
      ),
    );
  }
}