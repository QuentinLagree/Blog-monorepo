import { BadRequestException } from '@nestjs/common';

export class PasswordNotMatchException extends BadRequestException {
  constructor() {
    super();
  }
}
