import { Module } from '@nestjs/common';
import { AccountController } from './accounts.controller';
import { PrismaService } from 'src/commons/prisma/prisma.service';
import { AccountService } from './accounts.service';
import { UserService } from '../user/user.service';
import { PasswordService } from 'src/commons/services/argon.service';

@Module({
  controllers: [AccountController],
  providers: [AccountService, PrismaService, UserService, PasswordService],
  exports: [AccountService, PrismaService, UserService, PasswordService],
})
export class AccountsModule {}
