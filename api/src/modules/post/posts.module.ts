import { Module } from '@nestjs/common';
import { PostController } from './posts.controller';
import { PrismaService } from 'src/commons/prisma/prisma.service';
import { ArticleService } from './posts.service';
import { UserService } from '../user/user.service';
import { PasswordService } from 'src/commons/services/password.service';
import { SlugService } from 'src/commons/services/slug.service';

@Module({
  controllers: [PostController],
  providers: [ArticleService, PrismaService, UserService, PasswordService, SlugService],
  exports: [ArticleService, PrismaService, UserService, PasswordService, SlugService],
})
export class PostsModule {}
