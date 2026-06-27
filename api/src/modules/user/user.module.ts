import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { PrismaService } from 'src/commons/prisma/prisma.service';
import { UserService } from './user.service';
import { PasswordService } from 'src/commons/services/password.service';
import { UserToPostController } from './user-posts.controller';
import { ArticleService } from '../post/posts.service';

@Module({
  controllers: [UserController, UserToPostController],
  providers: [UserService, PrismaService, PasswordService, ArticleService],
  exports: [UserService, PrismaService, PasswordService, ArticleService],
})
export class UserModule {}
