import { Global, Module } from '@nestjs/common';
import { PasswordRecoveryController } from './password_recovery.controller';
import { AuthService } from '../auth/auth.service';
import { UserService } from '../user/user.service';
import { TokenService } from 'src/commons/token/token.service';
import { PrismaService } from 'src/commons/prisma/prisma.service';
import { PasswordService } from 'src/commons/services/password.service';
import { MailModule } from 'src/commons/mailing/mail/mailer.module';

@Module({
  imports: [MailModule], // ← c'est tout ce qu'il faut côté mail
  controllers: [PasswordRecoveryController],
  providers: [
    AuthService,
    PrismaService,
    UserService,
    TokenService,
    PasswordService,
  ],
  exports: [
    AuthService,
    PrismaService,
    UserService,
    TokenService,
    PasswordService,
  ],
})
export class PasswordRecoveryModule {}

