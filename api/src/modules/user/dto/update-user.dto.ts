import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsString, Length, MinLength } from 'class-validator';
import { UserEntity } from '../entities/user.entities';

export class UserUpdateDto extends PartialType(UserEntity) {
  @IsOptional()
  @IsString()
  //   @Length(3, 50)
  nom?: string;

  @IsOptional()
  @IsString()
  @Length(3, 50)
  prenom?: string;

  @IsOptional()
  @IsString()
  @Length(2, 16)
  pseudo?: string;

  @IsOptional()
  @IsString()
  @MinLength(4)
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(4)
  password?: string;

  @IsOptional()
  @IsString()
  role?: string;
}
