import { PartialType, OmitType } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, isString, IsString, Length } from 'class-validator';
import { PostsEntity } from '../entities/posts.entities';
import { User } from '@prisma/client';

export class CreatePostDto extends PartialType(
  OmitType(PostsEntity, ['id', 'updated_at', 'created_at', 'author'] as const),
) {
  @IsNotEmpty()
  @IsNumber()
  authorId: number;

  @IsNotEmpty()
  @IsString()
  @Length(5, 20)
  title: string;

  @IsNotEmpty()
  @IsString()
  content: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  published: boolean;
}
