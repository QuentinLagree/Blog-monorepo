import { Module } from '@nestjs/common';
import { AccountController } from './accounts.controller';
import { PrismaService } from 'src/commons/prisma/prisma.service';
import { AccountService } from './accounts.service';
import { UserService } from '../user/user.service';
import { PasswordService } from 'src/commons/services/argon.service';
import { ArticleService } from '../post/posts.service';

@Module({
  controllers: [AccountController],
  providers: [AccountService, PrismaService, UserService, PasswordService, ArticleService],
  exports: [AccountService, PrismaService, UserService, PasswordService, ArticleService],
})
export class AccountsModule {}
