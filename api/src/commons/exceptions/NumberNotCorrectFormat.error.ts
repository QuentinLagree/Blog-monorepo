import { BadRequestException } from "@nestjs/common";

export class NumberNotCorrectFormat  extends BadRequestException {
  constructor() {
    super();
  }
}
