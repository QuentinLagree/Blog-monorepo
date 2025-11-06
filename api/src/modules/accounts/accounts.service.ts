import { Injectable, NotFoundException } from "@nestjs/common";
import { Account, Prisma } from "@prisma/client";
import { PrismaService } from "src/commons/prisma/prisma.service";

@Injectable()
export class AccountService {

    constructor (
        private readonly _prisma: PrismaService
    ) {}
    
     async index(): Promise<Account[]> {
        return await this._prisma.account.findMany();
      }

      async show(uniqueProperties: Prisma.AccountWhereUniqueInput): Promise<Account> {
          try {
            const account = await this._prisma.account.findUnique({
              where: uniqueProperties,
            });
            if (!account) throw new NotFoundException();
            return account;
          } catch (error) {
            throw error;
          }
        }
      
}