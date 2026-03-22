import { Global, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import { LoggerService } from './commons/logger/logger.service';
import { ConfigurationModule } from './config/config.module';
import { moduleModules } from './modules/app-modules';

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: '.env', isGlobal: true }),
    ConfigurationModule,  // ← expose MailModule, Prisma, Redis, BullMQ
    ...moduleModules,     // UserModule, AuthModule, PasswordRecoveryModule, etc.
  ],
  controllers: [AppController],
  providers: [LoggerService], // évite d'ajouter ici RedisService/BullMQService s’ils sont déjà dans leurs modules
})
export class AppModule {}
