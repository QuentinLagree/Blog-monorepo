import { Module } from '@nestjs/common';

import { BullMQModule } from 'src/commons/mailing/bullmq/bullmq.module';
import { MailModule } from 'src/commons/mailing/mail/mailer.module';
import { TokenModule } from 'src/commons/services/token.module';

import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { PasswordRecoveryController } from './password_recovery.controller';

@Module({
  imports: [
    AuthModule,
    UserModule,
    TokenModule,
    MailModule,
    BullMQModule,
  ],
  controllers: [
    PasswordRecoveryController,
  ],
})
export class PasswordRecoveryModule {}