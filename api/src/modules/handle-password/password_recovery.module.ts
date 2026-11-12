import { Module } from '@nestjs/common';

import { BullMQModule } from 'src/commons/mailing/bullmq/bullmq.module';
import { MailModule } from 'src/commons/mailing/mail/mailer.module';
import { TokenModule } from 'src/commons/services/token.module';

import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { PasswordRecoveryController } from './password_recovery.controller';
import { PasswordRecoveryService } from './password-recovery.service';
import { PasswordModule } from 'src/commons/services/password.module';

@Module({
  imports: [
    PasswordModule,
    AuthModule,
    UserModule,
    TokenModule,
    MailModule,
    BullMQModule,
  ],
  controllers: [PasswordRecoveryController],
  providers: [PasswordRecoveryService],
})
export class PasswordRecoveryModule {}
