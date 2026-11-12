import { Module } from '@nestjs/common';

import { PasswordModule } from 'src/commons/services/password.module';

import { UserController } from './user.controller';
import { UserService } from './user.service';
import { PrismaModule } from 'src/commons/prisma/prisma.module';
import { ArticleService } from '../post/posts.service';

@Module({
  imports: [PasswordModule, PrismaModule],
  controllers: [UserController],
  providers: [UserService, ArticleService],
  exports: [UserService, ArticleService],
})
export class UserModule {}
