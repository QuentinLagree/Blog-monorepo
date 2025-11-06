import { Module } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokenService } from 'src/commons/token/token.service';
import { PrismaService } from 'src/commons/prisma/prisma.service';
import { PasswordService } from 'src/commons/services/password.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, PrismaService, UserService, TokenService, PasswordService],
  exports: [AuthService, PrismaService, UserService, TokenService, PasswordService],
})
export class AuthModule {}
