import { Module } from '@nestjs/common';

import { PasswordModule } from 'src/commons/services/password.module';

import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [
    PasswordModule,
  ],
  controllers: [
    UserController,
  ],
  providers: [
    UserService,
  ],
  exports: [
    UserService,
  ],
})
export class UserModule {}