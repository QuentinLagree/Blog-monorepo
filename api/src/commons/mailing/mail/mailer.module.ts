// src/mail/mail.module.ts
import { Global, Module } from '@nestjs/common';
import { MailerModule, MailerService } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailingService } from 'src/commons/mailing/mailing.service';
import { MailingController } from 'src/commons/mailing/mailing.controller';
import { join } from 'path';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';

@Global()
@Module({
  controllers: [MailingController],
  imports: [
    ConfigModule, // .env déjà chargé si ConfigModule.forRoot({ isGlobal: true }) dans AppModule
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
        template: {
      // à l'exécution, ce fichier existe car copié par l'étape 1
          dir: join(__dirname, 'mail', 'templates'),
          adapter: new HandlebarsAdapter(),
          options: { strict: true },
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
  exports: [MailerModule, MailingService], // ⬅️ indispensable pour rendre MailerService injectable partout
})
export class MailModule {}
