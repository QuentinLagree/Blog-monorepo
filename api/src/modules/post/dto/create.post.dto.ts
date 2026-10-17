import { ApiProperty } from '@nestjs/swagger';
import {
  IsDefined,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreatePostDto {
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @MaxLength(85, {
    message: "Le titre doit contenir au maximum $constraint1 caractères."
  })
  @MinLength(5, {
    message: "Le titre doit contenir au minimum $constraint1 caractères."
  })
  @ApiProperty({
    description: "Titre de l'article",
    type: 'string',
    example: "Titre de l'article"
  })
  title: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @ApiProperty({
    description: "Contenu de l'article",
    type: 'string',
    example: "Contenu de l'article en markdown"
  })
  content: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @ApiProperty({
    description: "Description de l'article",
    type: 'string',
    example: "Description de l'article"
  })
  description: string;
}