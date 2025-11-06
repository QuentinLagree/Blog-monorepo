import { Module } from '@nestjs/common';
import { AccountController } from './accounts.controller';
import { PrismaService } from 'src/commons/prisma/prisma.service';
import { AccountService } from './accounts.service';

@Module({
  controllers: [AccountController],
  providers: [AccountService, PrismaService],
  exports: [AccountService, PrismaService],
})
export class AccountsModule {}
