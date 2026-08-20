import { HttpException, HttpStatus } from '@nestjs/common';

export type ApiExceptionDocumentation = {
  description: string;
  messageExample: string;
};

export type DocumentedAppExceptionClass = {
  readonly status: HttpStatus;
  readonly documentation: ApiExceptionDocumentation;
  readonly prototype: AppException;
};

export class AppException extends HttpException {
  public readonly data: null = null;
  
  constructor(
    public readonly log: string,
    public readonly userMessage: string,
    status: HttpStatus,
    data: Error | null = null,
  ) {
    super(
      {
        log,
        message: userMessage,
        data
      },
      status,
    );

  }

  static getStatus () {
    return status;
  }
}