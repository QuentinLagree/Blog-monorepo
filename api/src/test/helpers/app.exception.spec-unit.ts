import { HttpStatus } from '@nestjs/common';
import { AppException } from 'src/commons/app.exception';

describe.only('AppException', () => {
  it('should create an AppException with default BAD_REQUEST status', () => {
    const exception = new AppException(
      'Message utilisateur',
      HttpStatus.BAD_REQUEST,
    );

    expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);

    expect(exception.getResponse()).toEqual({
      message: 'Message utilisateur',
      data: null,
    });
  });

  it('should create an AppException with custom status', () => {
    const exception = new AppException(
      "L'utilisateur n'existe pas.",
      HttpStatus.NOT_FOUND,
    );

    expect(exception.getStatus()).toBe(HttpStatus.NOT_FOUND);

    expect(exception.getResponse()).toEqual({
      message: "L'utilisateur n'existe pas.",
      data: null,
    });
  });

});