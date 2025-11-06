import { Global, Module } from '@nestjs/common';
import { MailModule } from './mail/mailer.module';
import { PrismaModule } from '../commons/prisma/prisma.module';

@Global()
@Module({
  imports: [MailModule, PrismaModule],
  exports: [MailModule, PrismaModule],
})
export class ConfigurationModule {}
