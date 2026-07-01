import { HttpStatus } from '@nestjs/common';
import { AppException } from 'src/commons/app.exception';

describe('AppException', () => {
  it('should create an AppException with default BAD_REQUEST status', () => {
    const exception = new AppException(
      'Technical log',
      'Message utilisateur',
      null,
    );

    expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);

    expect(exception.getResponse()).toEqual({
      log: 'Technical log',
      message: 'Message utilisateur',
      data: null,
    });
  });

  it('should create an AppException with custom status', () => {
    const exception = new AppException(
      'User not found',
      "L'utilisateur n'existe pas.",
      null,
      HttpStatus.NOT_FOUND,
    );

    expect(exception.getStatus()).toBe(HttpStatus.NOT_FOUND);

    expect(exception.getResponse()).toEqual({
      log: 'User not found',
      message: "L'utilisateur n'existe pas.",
      data: null,
    });
  });

  it('should keep data if provided', () => {
    const data = {
      id: 1,
    };

    const exception = new AppException(
      'Error with data',
      'Erreur avec données',
      data,
      HttpStatus.BAD_REQUEST,
    );

    expect(exception.getResponse()).toEqual({
      log: 'Error with data',
      message: 'Erreur avec données',
      data,
    });
  });
});