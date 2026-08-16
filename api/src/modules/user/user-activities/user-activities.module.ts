import { Module } from '@nestjs/common';
import { PostsModule } from 'src/modules/post/posts.module';
import { UserModule } from '../user.module';
import { UserActivityController } from './user-activities.controller';
import { PostOwnerOrAdminGuard } from 'src/commons/guards/post-owner-or-admin.guard';

@Module({
  imports: [
    UserModule,
    PostsModule,
  ],
  controllers: [
    UserActivityController,
  ],
  providers: [
    PostOwnerOrAdminGuard,
  ]
})
export class UserPostsModule {}