import { Module } from '@nestjs/common';
import { PostController } from './posts.controller';
import { PrismaService } from 'src/commons/prisma/prisma.service';
import { PostsService } from './posts.service';
import { UserService } from '../user/user.service';
import { PasswordService } from 'src/commons/services/password.service';

@Module({
  controllers: [PostController],
  providers: [PostsService, PrismaService, UserService, PasswordService],
  exports: [PostsService, PrismaService, UserService, PasswordService],
})
export class PostsModule {}
