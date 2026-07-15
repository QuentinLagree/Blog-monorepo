import { Module } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokenService } from 'src/commons/services/token.service';
import { PrismaService } from 'src/commons/prisma/prisma.service';
import { PasswordService } from 'src/commons/services/argon.service';
import { ArticleService } from '../post/posts.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, PrismaService, UserService, TokenService, PasswordService, ArticleService],
  exports: [AuthService, PrismaService, UserService, TokenService, PasswordService, ArticleService],
})
export class AuthModule {}
