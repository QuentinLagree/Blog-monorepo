import { Module } from '@nestjs/common';

import { UserModule } from '../user/user.module';
import { PostController } from './posts.controller';
import { ArticleService } from './posts.service';
import { SlugService } from 'src/commons/services/slug.service';
import { PrismaModule } from 'src/commons/prisma/prisma.module';

@Module({
  imports: [
    UserModule,
    PrismaModule
  ],
  controllers: [
    PostController,
  ],
  providers: [
    ArticleService,
    SlugService,
  ],
  exports: [
    ArticleService,
  ],
})
export class PostsModule {}