import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { PrismaService } from 'src/commons/prisma/prisma.service';
import { UserService } from './user.service';
import { PasswordService } from 'src/commons/services/password.service';
import { userToPostController } from './user-posts.controller';
import { ArticleService } from '../post/posts.service';

@Module({
  controllers: [UserController, userToPostController],
  providers: [UserService, PrismaService, PasswordService, ArticleService],
  exports: [UserService, PrismaService, PasswordService, ArticleService],
})
export class UserModule {}
