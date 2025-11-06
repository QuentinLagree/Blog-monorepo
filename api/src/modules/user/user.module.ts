import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { PrismaService } from 'src/commons/prisma/prisma.service';
import { UserService } from './user.service';
import { PasswordService } from 'src/commons/services/password.service';

@Module({
  controllers: [UserController],
  providers: [UserService, PrismaService, PasswordService],
  exports: [UserService, PrismaService, PasswordService],
})
export class UserModule {}
