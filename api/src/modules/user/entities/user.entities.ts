import { ApiProperty } from '@nestjs/swagger';
import { Post, User } from '@prisma/client';
import { Exclude } from 'class-transformer';

export class UserEntity implements User {
  @ApiProperty({
    type: "string",
    description: "Identifiant unique de l'utilisateur",
    example: 42,
  })
  id: number;

 @ApiProperty({
    type: "string",
    description: "Le nom de famille de l'utilisateur",
    example: "Doe"
  })
  nom: string;
  @ApiProperty({
    type: "string",
    description: "Le prénom de l'utilisateur",
    example: "John"
  })
  prenom: string;
  @ApiProperty({
    type: 'string',
    description: "Le pseudonyme unique de l'utilisateur.",
    example: "johndoe42"
  })
  pseudo: string;
  @ApiProperty({
    type: 'string',
    description: "l'Email unique de l'utilisateur.",
    example: "johndoe42@gmail.com"
  })
  email: string;

  @Exclude({
    toPlainOnly: true,
  })
  password: string;

  @Exclude({
    toPlainOnly: true,
  })
  role: string;

  
  @ApiProperty({
    type: 'string',
    format: 'date-time',
    description: "Date et heure de création du compte utilisateur.",
    example: "2026-08-10T00:00:00.000Z"
  })
  created_at: Date;
  @ApiProperty({
    type: 'string',
    format: 'date-time',
    description: "Date et heure de modification du compte utilisateur.",
    example: "2026-08-17T00:00:00.000Z"
  })
  updated_at: Date;

  @ApiProperty({
    type: 'array',
    description: "Publications de l'utilisateur.",
    example: "[]"
  })
  posts?: Post[];

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }
}
