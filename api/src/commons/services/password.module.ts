import { Module } from '@nestjs/common';

import { PasswordService } from './argon.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [
    PasswordService,
  ],
  exports: [
    PasswordService,
  ],
})
export class PasswordModule {}