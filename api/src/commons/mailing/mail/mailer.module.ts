// src/mail/mail.module.ts
import { Global, Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailingService } from 'src/commons/mailing/mailing.service';

@Global()
@Module({
  imports: [
    ConfigModule,
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        transport: {
          host: cfg.get<string>('EMAIL_HOST'),
          port: Number(cfg.get('EMAIL_PORT') ?? 587),
          secure: cfg.get<string>('EMAIL_SECURE') === 'true',
          auth: {
            user: cfg.get<string>('EMAIL_USERNAME'),
            pass: cfg.get<string>('EMAIL_PASSWORD'),
          },
        },
        defaults: {
          from:
            cfg.get<string>('MAIL_FROM') ??
            `"${cfg.get('MAIL_FROM_NAME') ?? 'No-Reply'}" <${cfg.get('EMAIL_USERNAME')}>`,
        },
      }),
    }),
  ],
  providers: [MailingService],
  exports: [MailerModule, MailingService],
})
export class MailModule { }
