// api/test/helpers/test-app.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from 'src/app.controller';

import { AuthModule } from 'src/modules/auth/auth.module';
import { PostsModule } from 'src/modules/post/posts.module';
import { UserModule } from 'src/modules/user/user.module';
import { UserPreferencesModule } from
  'src/modules/user-preferences/user-preferences.module';

import { TestMocksModule } from './test.mock-module';
import { TestPasswordRecoveryModule } from
  './test-password-recovery.module';
import { UserPostsModule } from 'src/modules/user/user-post/user-posts.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env.test',
      isGlobal: true,
    }),

    TestMocksModule,

    UserModule,
    AuthModule,
    PostsModule,
    UserPostsModule,
    TestPasswordRecoveryModule,
    UserPreferencesModule,
  ],
  controllers: [
    AppController,
  ],
})
export class TestAppModule {}