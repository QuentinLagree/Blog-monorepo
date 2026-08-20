import { ApiProperty } from '@nestjs/swagger';
import {
  IsDefined,
  MinLength,
  MaxLength,
  IsString,
  IsEmail,
} from 'class-validator';

export class CreateUserDto  {
  @ApiProperty({
    type: "string",
    description: "Le nom de famille de l'utilisateur",
    example: "Doe"
  })
  @IsDefined({
    message: 'Le Nom de famille doit être défini.',
  })
  @MinLength(1, {
    message: 'Le nom de famille doit contenir au moins 1 caractère.',
  })
  @MaxLength(50, {
    message: 'Le nom de famille doit contenir au maximum 50 caractères.',
  })
  nom: string;
  @ApiProperty({
    type: "string",
    description: "Le prénom de l'utilisateur",
    example: "John"
  })
  @IsDefined({
    message: 'Le Prénom doit être défini.',
  })
  @MinLength(2, { message: 'Le Prénom doit contenir au moins 2 caractères.' })
  @MaxLength(16, {
    message: 'Le Prénom doit contenir au maximum 16 caractères.',
  })
  @IsString()
  prenom: string;
  @ApiProperty({
    type: 'string',
    description: "Le pseudonyme unique de l'utilisateur.",
    example: "johndoe42"
  })
  @IsDefined()
  @IsString()
  @MinLength(2, { message: 'Le Pseudo doit contenir au moins 2 caractères.' })
  @MaxLength(16, {
    message: 'Le Pseudo doit contenir au maximum 16 caractères.',
  })
  pseudo: string;
  @ApiProperty({
    type: 'string',
    description: "l'Email unique de l'utilisateur.",
    example: "johndoe42@gmail.com"
  })
  @IsDefined({
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
  @ApiProperty({
    type: 'string',
    description: "Le mot de passe de l'utilisateur.",
    example: "password"
  })
  @IsDefined({
    message: "Le mot de passe doit être défini.",
  })
  @MinLength(4, {
    message: 'Le mot de passe doit avoir 4 caractères minimum.',
  })
  @IsString()
  @MaxLength(255, {
    message: 'Le mot de passe doit contenir au maximum 255 caractères.',
  })
  password: string;
}
