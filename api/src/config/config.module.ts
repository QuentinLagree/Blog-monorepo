import { Global, Module } from '@nestjs/common';

import { BullMQModule } from 'src/commons/mailing/bullmq/bullmq.module';
import { MailModule } from 'src/commons/mailing/mail/mailer.module';
import { PrismaModule } from 'src/commons/prisma/prisma.module';
import { RedisModule } from 'src/commons/redis/redis.module';

@Global()
@Module({
  imports: [
    MailModule,
    PrismaModule,
    RedisModule,
    BullMQModule,
  ],
  exports: [
    MailModule,
    PrismaModule,
    RedisModule,
    BullMQModule,
  ],
})
export class ConfigurationModule {}