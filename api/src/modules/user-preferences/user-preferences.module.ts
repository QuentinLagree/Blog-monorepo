import { Module } from '@nestjs/common';
import { PrismaService } from 'src/commons/prisma/prisma.service';
import { UserPreferenceController } from './user-preferences.controller';
import { UserPreferenceService } from './user-preferences.service';

@Module({
  controllers: [UserPreferenceController],
  providers: [UserPreferenceService, PrismaService],
  exports: [UserPreferenceService, PrismaService],
})
export class UserPreferencesModule {}
