import { HttpStatus } from "@nestjs/common";
import { DocumentedAppExceptionClass } from "../app.exception";
type GroupedExceptions = Partial<
  Record<HttpStatus, DocumentedAppExceptionClass[]>
>;

export const groupByExceptions = (exceptions: DocumentedAppExceptionClass[], key: string): GroupedExceptions => {
  return exceptions.reduce(function(exception, index) {
    (exception[index[key]] ??= []).push(index);
    return exception;
  }, {});
};