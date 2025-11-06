import {
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';

export class PasswordNotSameException extends BadRequestException {
  constructor() {
    super();
  }
}
