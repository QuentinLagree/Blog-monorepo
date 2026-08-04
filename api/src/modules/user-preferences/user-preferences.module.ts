import { Module } from '@nestjs/common';

import { UserPreferenceController } from './user-preferences.controller';
import { UserPreferenceService } from './user-preferences.service';

@Module({
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