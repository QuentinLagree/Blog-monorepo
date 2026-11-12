import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsEmail,
  MinLength,
  IsDefined,
  MaxLength,
} from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    type: 'string',
    description: "l'Email unique de l'utilisateur.",
    example: 'johndoe42@gmail.com',
  })
  @IsDefined({
    message: "L'email doit être défini.",
  })
  @IsEmail({}, { message: "L'email n'est pas valide." })
  @MinLength(5, {
    message: "L'email doit avoir au minimum $constraint1 caractères.",
  })
  @MaxLength(255, {
    message: "L'email doit contenir au maximum $constraint1 caractères.",
  })
  email: string;

  @ApiProperty({
    type: 'string',
    description: "Le mot de passe de l'utilisateur.",
    example: 'password',
  })
  @IsDefined({
    message: 'Le mot de passe doit être défini.',
  })
  @MinLength(12, {
    message: 'Le mot de passe doit avoir $constraint1 caractères minimum.',
  })
  @IsString()
  @MaxLength(255, {
    message:
      'Le mot de passe doit contenir au maximum $constraint1 caractères.',
  })
  password: string;
  @ApiProperty({
    type: 'string',
    description: "Le mot de passe de l'utilisateur.",
    example: 'password',
  })
  @IsDefined({
    message: 'Le mot de passe doit être défini.',
  })
  @MinLength(12, {
    message: 'Le mot de passe doit avoir $constraint1 caractères minimum.',
  })
  @IsString()
  @MaxLength(255, {
    message:
      'Le mot de passe doit contenir au maximum $constraint1 caractères.',
  })
  confirm_password: string;
  @ApiProperty({
    type: 'string',
    description:
      'Token de réinitialisation reçu par email, associé au compte et non expiré. Il doit contenir exactement 32 caractères hexadécimaux.',
    example: '1234567890abcdef1234567890abcdef',
    minLength: 32,
    maxLength: 32,
    pattern: '^[0-9a-fA-F]{32}$',
    required: true,
  })
  @IsNotEmpty()
  @MaxLength(32, {
    message:
      'Le token est invalide, il doit contenir au maximum $constraint1 caractère(s).',
  })
  @IsString()
  token: string;
}
