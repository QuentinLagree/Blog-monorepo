import { Module } from '@nestjs/common';

import { UserPreferenceController } from './user-preferences.controller';
import { UserPreferenceService } from './user-preferences.service';
import { PrismaModule } from 'src/commons/prisma/prisma.module';

@Module({
  imports: [
    PrismaModule
  ],
  controllers: [
    UserPreferenceController,
  ],
  providers: [
    UserPreferenceService,
  ],
  exports: [
    UserPreferenceService,
  ],
})
export class UserPreferencesModule {}