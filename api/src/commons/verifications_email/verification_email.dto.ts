import { PartialType, OmitType } from '@nestjs/swagger';
import { IsNotEmpty, Length, IsString, IsEmail, IsDate } from 'class-validator';
import { VerificationEmailEntity } from './verification_email.entities';

export class VerificationEmailDto extends PartialType(
  OmitType(VerificationEmailEntity, ['id', 'created_at'] as const),
) {
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @Length(32)
  @IsString()
  code: string;

  @IsNotEmpty()
  @IsDate()
  expired_at: Date;
}
