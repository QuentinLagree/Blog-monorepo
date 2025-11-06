import { Module } from '@nestjs/common';
import { PasswordRecoveryController } from './password_recovery.controller';
import { AuthService } from '../auth/auth.service';
import { UserService } from '../user/user.service';
import { TokenService } from 'src/commons/token/token.service';
import { MailService } from 'src/config/mail/mailer.service';
import { PrismaService } from 'src/commons/prisma/prisma.service';
import { PasswordService } from 'src/commons/services/password.service';

@Module({
  controllers: [PasswordRecoveryController],
  providers: [
    AuthService,
    PrismaService,
    UserService,
    TokenService,
    MailService,
    PasswordService
  ],
  exports: [AuthService, PrismaService, UserService, TokenService, MailService, PasswordService],
})
export class PasswordRecoveryModule {}
