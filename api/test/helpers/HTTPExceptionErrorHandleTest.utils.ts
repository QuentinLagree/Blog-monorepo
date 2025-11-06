import { HttpException, HttpStatus } from '@nestjs/common';

export async function expectHttpExceptionWithMessage(
  fn: () => Promise<any>,
  expectedStatus: HttpStatus,
  expectedMessage: any,
  serviceMock?: jest.Mock,
  serviceCallCount = 0,
) {
  try {
    await fn();
    fail('Should have thrown an HttpException');
  } catch (e: unknown) {
    expect(e).toBeInstanceOf(HttpException);
    if (e instanceof HttpException) {
      expect(e.getStatus()).toBe(expectedStatus);
      expect(e.getResponse()).toEqual(expectedMessage);
      if (serviceMock) {
        if (serviceCallCount > 0) expect(serviceMock).toHaveBeenCalled();
        expect(serviceMock).toHaveBeenCalledTimes(serviceCallCount);
      }
    }
  }
}
