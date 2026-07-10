import { PartialType, OmitType } from '@nestjs/swagger';
import { IsDate, IsDateString, IsNotEmpty, IsNumber, isString, IsString, Length } from 'class-validator';
import { PostsEntity } from '../entities/posts.entities';
import { User } from '@prisma/client';

export class UpdatePostDto extends PartialType(
  OmitType(PostsEntity, ['id', 'updated_at', 'created_at', 'author', 'authorId', 'published_at'] as const),
) {
  @IsString()
  @Length(5, 85)
  override title?: string;

  @IsString()
  override content?: string;

  @IsString()
  override description?: string;
}