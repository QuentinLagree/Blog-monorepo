import { IsNotEmpty, IsString, IsEmail, MinLength } from 'class-validator';

export class UserLoginCredentials {
  @IsNotEmpty()
  @IsString()
  @IsEmail({}, { message: "L'email n'est pas valide !" })
  email: string;
  @MinLength(4, {
    message: "L'email doit contenir au minimum $constraint1 caractère(s)."
  })
  @IsString()
  password: string;
}
