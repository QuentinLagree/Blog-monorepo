// api/test/helpers/test-app.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from 'src/app.controller';

import { UserModule } from 'src/modules/user/user.module';
import { AuthModule } from 'src/modules/auth/auth.module';
import { TestMocksModule } from './test.mock-module';
import { PostsModule } from 'src/modules/post/posts.module';
import { TestPasswordRecoveryModule } from './test-password-recovery.module';


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
    TestPasswordRecoveryModule,
  ],
  controllers: [AppController],
})
export class TestAppModule {}