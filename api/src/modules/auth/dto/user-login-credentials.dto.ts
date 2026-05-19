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
  override email: string;
  @MinLength(4)
  @IsString()
  override password: string;
}
