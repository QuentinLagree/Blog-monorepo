import { BadRequestException } from '@nestjs/common';
import { ValidationError } from 'class-validator';

export class isFieldsInvalid extends BadRequestException {
  constructor(errors: ValidationError[]) {
    super(errors);
  }
}
