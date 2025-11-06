import { Global, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import { LoggerService } from './commons/logger/logger.service';
import { ConfigurationModule } from './config/config.module';
import { moduleModules } from './modules/app-modules';

@Global()
@Module({
  imports: [
    ...moduleModules,
    ConfigurationModule,
    ConfigModule.forRoot({ envFilePath: '.env', isGlobal: true }),
  ],
  providers: [LoggerService],
  controllers: [
    AppController,

  ],
})
export class AppModule {}
