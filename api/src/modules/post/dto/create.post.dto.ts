import { ApiProperty } from '@nestjs/swagger';
import {
  IsDefined,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreatePostDto {
  @IsDefined({
    message: "Le titre de l'article doit être défini.",
  })
  @IsString({
    message: "Le titre de l'article doit être une chaîne de caractères.",
  })
  @IsNotEmpty({
    message: "Le titre de l'article ne doit pas être vide.",
  })
  @MaxLength(85, {
    message: "Le titre doit contenir au maximum $constraint1 caractères.",
  })
  @MinLength(5, {
    message: "Le titre doit contenir au minimum $constraint1 caractères.",
  })
  @ApiProperty({
    description: "Titre de l'article.",
    type: String,
    minLength: 5,
    maxLength: 85,
    example: "Comment développer une API REST avec NestJS",
    required: true,
  })
  title: string;

  @IsDefined({
    message: "Le contenu de l'article doit être défini.",
  })
  @IsString({
    message: "Le contenu de l'article doit être une chaîne de caractères.",
  })
  @IsNotEmpty({
    message: "Le contenu de l'article ne doit pas être vide.",
  })
  @MinLength(10, {
    message: "Le contenu de l'article doit contenir au minimum $constraint1 caractères.",
  })
  @ApiProperty({
    description: "Contenu de l'article au format Markdown.",
    type: String,
    minLength: 10,
    example: "# Introduction\n\nDans cet article, nous allons découvrir NestJS.",
    required: true,
  })
  content: string;

  @IsDefined({
    message: "La description de l'article doit être définie.",
  })
  @IsString({
    message: "La description de l'article doit être une chaîne de caractères.",
  })
  @IsNotEmpty({
    message: "La description de l'article ne doit pas être vide.",
  })
  @MinLength(2, {
    message: "La description de l'article doit contenir au minimum $constraint1 caractères.",
  })
  @ApiProperty({
    description: "Description courte présentant le contenu de l'article.",
    type: String,
    minLength: 2,
    example: "Découvrez comment créer une API REST avec NestJS et TypeScript.",
    required: true,
  })
  description: string;
}