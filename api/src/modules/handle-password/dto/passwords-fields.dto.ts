import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEmail, MinLength } from 'class-validator';

export class UserPasswordFields {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty()
  @MinLength(4)
  @IsString()
  old_password: string;
  @ApiProperty()
  @MinLength(4)
  @IsString()
  password: string;
  @ApiProperty()
  @MinLength(4)
  @IsString()
  confirm_password: string;
}
