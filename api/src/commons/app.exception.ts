import { HttpException, HttpStatus } from '@nestjs/common';
import { ValidationError } from 'class-validator';

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
  public readonly data: null | ValidationError[] = null;
  
  constructor(
    public readonly userMessage: string,
    status: HttpStatus,
    data: Error | ValidationError[] | null = null,
  ) {
    super(
      {
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