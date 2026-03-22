import { PrismaModule } from "src/commons/prisma/prisma.module";
import { MailModule } from "../commons/mailing/mail/mailer.module";
import { BullMQModule } from "src/commons/mailing/bullmq/bullmq.module";
import { RedisModule } from "src/commons/redis/redis.module";
import { Global, Module } from "@nestjs/common";

@Global()
@Module({
  imports: [
    // ne PAS ajouter MailerModule ici
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
