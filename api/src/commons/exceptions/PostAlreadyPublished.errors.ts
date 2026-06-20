import { ForbiddenException, HttpStatus } from "@nestjs/common";
import { Message } from "../types/dto/message/message";

export class PostIsAlreadyPublish extends ForbiddenException {
  constructor() {
    super();
  }
}
