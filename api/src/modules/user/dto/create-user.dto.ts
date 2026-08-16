import {
  IsDefined,
  MinLength,
  MaxLength,
  IsString,
  IsEmail,
} from 'class-validator';

export class CreateUserDto  {
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
  @IsDefined({
    message: 'Le Prénom doit être défini.',
  })
  @MinLength(2, { message: 'Le Prénom doit contenir au moins 2 caractères.' })
  @MaxLength(16, {
    message: 'Le Prénom doit contenir au maximum 16 caractères.',
  })
  @IsString()
  prenom: string;
  @IsDefined()
  @IsString()
  @MinLength(2, { message: 'Le Pseudo doit contenir au moins 2 caractères.' })
  @MaxLength(16, {
    message: 'Le Pseudo doit contenir au maximum 16 caractères.',
  })
  pseudo: string;
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
  @IsDefined({
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
}
