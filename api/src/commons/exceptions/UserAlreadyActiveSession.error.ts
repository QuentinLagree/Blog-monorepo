import { ForbiddenException } from '@nestjs/common';

export class UserAlreadyActiveSession extends ForbiddenException {
  constructor() {
    super();
  }
}
