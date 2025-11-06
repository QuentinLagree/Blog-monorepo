import { ForbiddenException } from '@nestjs/common';

export class UserAlreadyExistWithEmail extends ForbiddenException {
  constructor() {
    super();
  }
}

export class UserAlreadyExistWithPseudo extends ForbiddenException {
  constructor() {
    super();
  }
}
