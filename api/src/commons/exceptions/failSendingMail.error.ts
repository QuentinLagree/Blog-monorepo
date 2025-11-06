import { ServiceUnavailableException } from '@nestjs/common';

export class FailSendingMail extends ServiceUnavailableException {
  constructor() {
    super();
  }
}
