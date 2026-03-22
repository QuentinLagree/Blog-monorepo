import { NotAcceptableException } from '@nestjs/common';

export class UnexistQueueInListQueues extends NotAcceptableException {
  constructor(message?: string) {
    super(message);
    this.name = this.constructor.name;
  }
}
