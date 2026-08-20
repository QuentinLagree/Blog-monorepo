import { HttpStatus } from '@nestjs/common';
import { ApiSchema } from '@nestjs/swagger';
import { ApiExceptionDocumentation, AppException } from 'src/commons/app.exception';

type Property = 'email' | 'pseudo'

export class UserAlreadyExistException extends AppException {
  static readonly status = HttpStatus.CONFLICT

  static readonly documentation = {
    description : "L'adresse email ou le pseudo est déjà utilisé par un autre utilisateur.",
    messageExample: "L'email est déjà utilisé, connectez-vous si c'est bien vous."
  } satisfies ApiExceptionDocumentation
  
  constructor(property: Property) {
    super(
      `${property} already use.`,
      `${property} déjà utilisé, connectez-vous si c'est bien vous.`,
      UserAlreadyExistException.status
    );
  }
}