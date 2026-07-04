// api/test/helpers/test-password-recovery.module.ts

import { Module } from '@nestjs/common';
import { AuthService } from 'src/modules/auth/auth.service';
import { UserService } from 'src/modules/user/user.service';
import { TokenService } from 'src/commons/services/token.service';
import { MailingService } from 'src/commons/mailing/mailing.service';
import { PrismaService } from 'src/commons/prisma/prisma.service';
import { PasswordService } from 'src/commons/services/argon.service';
import { MAIL_QUEUE } from 'src/commons/mailing/bullmq/bullmq.token';
import { PasswordRecoveryController } from 'src/modules/handle-password/password_recovery.controller';

@Module({
  controllers: [PasswordRecoveryController],
  providers: [
    AuthService,
    UserService,
    TokenService,
    MailingService,
    PrismaService,
    PasswordService,
    {
      provide: MAIL_QUEUE,
      useValue: {
        add: jest.fn(),
        close: jest.fn(),
        on: jest.fn(),
      },
    },
  ],
})
export class TestPasswordRecoveryModule {}