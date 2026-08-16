import {
  IsDefined,
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UserDto   {
  @IsDefined({
    message: 'Le Nom de famille doit être défini.',
  })
  @MinLength(1, {
    message: 'Le nom de famille doit contenir au moins 1 caractère.',
  })
  @MaxLength(50, {
    message: 'Le nom de famille doit contenir au maximum 50 caractères.',
  })
  @ApiProperty({
    example: "Doe",
    type:"string",
    description: "Nom de l'utilisateur"
  })
  nom: string;
  @IsDefined({
    message: 'Le Prénom doit être défini.',
  })
  @MinLength(2, { message: 'Le Prénom doit contenir au moins 2 caractères.' })
  @MaxLength(16, {
    message: 'Le Prénom doit contenir au maximum 16 caractères.',
  })
  @IsString()
  @ApiProperty({
    example: "John",
    type:"string",
    description: "Prénom de l'utilisateur",
  })
  prenom: string;
  @IsNotEmpty()
  @IsString()
  @MinLength(2, { message: 'Le Pseudo doit contenir au moins 2 caractères.' })
  @MaxLength(16, {
    message: 'Le Pseudo doit contenir au maximum 16 caractères.',
  })
  pseudo: string;
  @IsNotEmpty({
    message: "L'email doit être défini.",
  })
  @IsEmail({}, { message: "L'email n'est pas valide." })
  @MinLength(5, {
    message: "L'email doit avoir au minimum 5 caractères.",
  })
  @MaxLength(255, {
    message: "L'email doit contenir au maximum 255 caractères.",
  })
  email: string;
  @IsNotEmpty({
    message: "L'Adresse email doit être défini.",
  })
  @MinLength(4, {
    message: 'Le mot de passe doit avoir 4 caractères minimum.',
  })
  @IsString()
  @MaxLength(255, {
    message: 'Le mot de passe doit contenir au maximum 255 caractères.',
  })
  password: string;
  @IsString()
  @MaxLength(255, {
    message: 'Le rôle doit contenir au maximum 255 caractères.',
  })
  role: string;
}
