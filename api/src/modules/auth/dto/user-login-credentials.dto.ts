import { PickType } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEmail, MinLength } from 'class-validator';
import { UserEntity } from 'src/modules/user/entities/user.entities';

export class UserLoginCredentials extends PickType(UserEntity, [
  'email',
  'password',
] as const) {
  @IsNotEmpty()
  @IsString()
  @IsEmail({}, { message: "L'email n'est pas valide !" })
  email: string;
  @MinLength(4)
  @IsString()
  password: string;
}
