import { PartialType, OmitType } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEmail } from 'class-validator';
import { UserLoginCredentials } from 'src/modules/auth/dto/user-login-credentials.dto';

export class UserEmail extends PartialType(
  OmitType(UserLoginCredentials, ['password'] as const),
) {
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email: string;
}
