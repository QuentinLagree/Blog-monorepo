import { PartialType, OmitType } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { IsNotEmpty, Length, IsString, IsNumber } from 'class-validator';
import { PostsEntity } from '../entities/posts.entities';

export class Posts extends PartialType(PostsEntity) {
  @IsNotEmpty()
  override id: number;
  @IsNotEmpty()
  override authorId: number;
  @IsNotEmpty()
  override title: string;
  @IsNotEmpty()
  override content: string;
  @IsNotEmpty()
  override description: string;
  @IsNotEmpty()
  override created_at: Date;
  @IsNotEmpty()
  override updated_at: Date;
  @IsNotEmpty()
  override published_at: Date;
  @IsNotEmpty()
  override author: User;
}
