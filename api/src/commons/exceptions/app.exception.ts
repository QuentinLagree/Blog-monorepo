import { HttpException, HttpStatus } from '@nestjs/common';

export class AppException<T = any> extends HttpException {
  constructor(
    public readonly log: string,
    public readonly userMessage: string,
    public readonly data: T | null = null,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super(
      {
        log,
        message: userMessage,
        data,
      },
      status,
    );
  }
}