import { Module } from '@nestjs/common';

import { PasswordModule } from 'src/commons/services/password.module';

import { PrismaModule } from 'src/commons/prisma/prisma.module';
import { MeController } from './me.controller';
import { UserService } from '../user/user.service';
import { ArticleService } from '../post/posts.service';

@Module({
  imports: [
    PasswordModule,
    PrismaModule
  ],
  controllers: [
    MeController,
  ],
  providers: [
    UserService,
    ArticleService
  ],
  exports: [
    UserService,
    ArticleService
  ],
})
export class MeModule {}