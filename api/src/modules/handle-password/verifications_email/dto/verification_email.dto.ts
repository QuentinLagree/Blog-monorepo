import { PartialType, OmitType } from '@nestjs/swagger';
import { IsNotEmpty, Length, IsString, IsEmail, IsDate, MaxLength } from 'class-validator';
import { VerificationEmailEntity } from '../entities/verification_email.entities';

export class VerificationEmailDto {
  @IsNotEmpty()
  @IsString()
  @IsEmail({}, {
    message: "L'email n'est pas valide."
  })
  email: string;

  @IsNotEmpty()
  @MaxLength(32, {
    message: "Le code est invalide, il doit contenir au maximum $constraint1 caractère(s)."
  })
  @IsString()
  code: string;

  @IsNotEmpty()
  @IsDate({
    message: "La date d'expiration du token est invalide. Elle doit être du format Date ISO."
  })
  expired_at: Date;
}
