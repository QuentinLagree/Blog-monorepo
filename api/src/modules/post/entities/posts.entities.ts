import { ApiProperty } from '@nestjs/swagger';
import { Post, User } from '@prisma/client';

export class PostsEntity implements Post {
  @ApiProperty()
  id: number;
  @ApiProperty()
  authorId: number;
  @ApiProperty()
  title: string;
  @ApiProperty()
  content: string;
  @ApiProperty()
  description: string;
  @ApiProperty()
  published: boolean;
  @ApiProperty()
  created_at: Date;
  @ApiProperty()
  updated_at: Date;
  @ApiProperty()
  author: User;

  constructor(partial: Partial<PostsEntity>) {
    Object.assign(this, partial);
  }
}
