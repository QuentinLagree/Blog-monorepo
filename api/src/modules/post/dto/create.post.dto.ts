import { PartialType, OmitType } from '@nestjs/swagger';
import { IsDate, IsDateString, IsDefined, IsNotEmpty, IsNumber, isString, IsString, Length } from 'class-validator';
import { PostsEntity } from '../entities/posts.entities';

export class CreatePostDto extends PartialType(
  OmitType(PostsEntity, ['id', 'updated_at', 'created_at', 'author'] as const),
) {
  @IsNotEmpty()
  @IsDefined()
  @IsNumber()
  override authorId: number;

  @IsNotEmpty()
  @IsString()
  @Length(5, 85)
  override title: string;

  @IsNotEmpty()
  @IsString()
  override content: string;

  @IsNotEmpty()
  @IsString()
  override description: string;
}
