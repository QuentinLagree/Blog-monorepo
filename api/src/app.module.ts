import { Module } from '@nestjs/common';

import { ConfigModule } from '@nestjs/config';

import { LoggerService } from './commons/logger/logger.service';
import { ConfigurationModule } from './config/config.module';
import { moduleModules } from './modules/app-modules';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    ConfigurationModule,
    ...moduleModules,
  ],
  providers: [
    LoggerService,
  ],
})
export class AppModule {}