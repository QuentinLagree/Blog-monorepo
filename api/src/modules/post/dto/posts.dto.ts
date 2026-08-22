import { PartialType, OmitType } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { IsNotEmpty, Length, IsString, IsNumber, IsArray } from 'class-validator';
import { PostsEntity } from '../entities/posts.entities';

export class Articles extends PartialType(PostsEntity) {
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
  @IsArray()
  like: [];
  @IsNotEmpty()
  override published_at: Date;
  @IsNotEmpty()
  override author: User;
}
