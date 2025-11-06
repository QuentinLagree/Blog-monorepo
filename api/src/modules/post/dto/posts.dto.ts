import { PartialType, OmitType } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { IsNotEmpty, Length, IsString, IsNumber } from 'class-validator';
import { PostsEntity } from '../entities/posts.entities';

export class Posts extends PartialType(PostsEntity) {
  @IsNotEmpty()
  id: number;
  @IsNotEmpty()
  authorId: number;
  @IsNotEmpty()
  title: string;
  @IsNotEmpty()
  content: string;
  @IsNotEmpty()
  description: string;
  @IsNotEmpty()
  published: boolean;
  @IsNotEmpty()
  created_at: Date;
  @IsNotEmpty()
  updated_at: Date;
  @IsNotEmpty()
  author: User;
}
