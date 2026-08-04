import { Module } from '@nestjs/common';

import { PasswordService } from './argon.service';

@Module({
  providers: [
    PasswordService,
  ],
  exports: [
    PasswordService,
  ],
})
export class PasswordModule {}