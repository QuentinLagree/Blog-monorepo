import { PartialType, OmitType } from '@nestjs/swagger';
import { IsDate, IsDateString, IsNotEmpty, IsNumber, isString, IsString, Length } from 'class-validator';
import { PostsEntity } from '../entities/posts.entities';
import { User } from '@prisma/client';

export class CreatePostDto extends PartialType(
  OmitType(PostsEntity, ['id', 'updated_at', 'created_at', 'author'] as const),
) {
  @IsNotEmpty()
  @IsNumber()
  override authorId: number;

  @IsNotEmpty()
  @IsString()
  @Length(5, 35)
  override title: string;

  @IsNotEmpty()
  @IsString()
  override content: string;

  @IsNotEmpty()
  @IsString()
  override description: string;

  @IsDateString()
  override published_at: Date;
}
