import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsString, Length, MinLength } from 'class-validator';
import { UserEntity } from '../entities/user.entities';

export class UserUpdateDto extends PartialType(UserEntity) {
  @IsOptional()
  @IsString()
  //   @Length(3, 50)
  override nom?: string;

  @IsOptional()
  @IsString()
  @Length(3, 50)
  override prenom?: string;

  @IsOptional()
  @IsString()
  @Length(2, 16)
  override pseudo?: string;

  @IsOptional()
  @IsString()
  @MinLength(4)
  override email?: string;

  @IsOptional()
  @IsString()
  @MinLength(4)
  override password?: string;

  @IsOptional()
  @IsString()
  override role?: string;
}
