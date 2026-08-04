import { Module } from '@nestjs/common';

import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PasswordModule } from 'src/commons/services/password.module';
import { PrismaModule } from 'src/commons/prisma/prisma.module';

@Module({
  imports: [
    PasswordModule,
    UserModule,
    PrismaModule
  ],
  controllers: [
    AuthController,
  ],
  providers: [
    AuthService,
  ],
  exports: [
    AuthService,
  ],
})
export class AuthModule {}