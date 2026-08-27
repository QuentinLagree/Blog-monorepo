import { ApiProperty } from '@nestjs/swagger';
import {
  IsDefined,
  IsNotEmpty,
  IsString,
  Length,
} from 'class-validator';

export class CreatePostDto {
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @Length(5, 85)
  @ApiProperty({
    description: "Titre de l'article",
    type: 'string',
    example: "Titre de l'article"
  })
  title: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: "Contenu de l'article",
    type: 'string',
    example: "Contenu de l'article en markdown"
  })
  content: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: "Description de l'article",
    type: 'string',
    example: "Description de l'article"
  })
  description: string;
}