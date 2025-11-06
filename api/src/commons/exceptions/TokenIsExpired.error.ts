import { ForbiddenException } from '@nestjs/common';

export class TokenExpiredOrInvalidException extends ForbiddenException {
  constructor() {
    super();
    this.name = this.constructor.name;
  }
}
