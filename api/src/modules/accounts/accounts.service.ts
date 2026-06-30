import { Injectable } from "@nestjs/common";
import { Account, Prisma } from "@prisma/client";
import { PrismaService } from "src/commons/prisma/prisma.service";
import { AccountNotFoundException } from "./exceptions/account-not-found.exception";

@Injectable()
export class AccountService {

    constructor (
        private readonly _prisma: PrismaService
    ) {}
    
     async index(): Promise<Account[]> {
        return await this._prisma.account.findMany();
      }

      async show(uniqueProperties: Prisma.AccountWhereUniqueInput): Promise<Account> {
          const account = await this._prisma.account.findUnique({
            where: uniqueProperties,
          });
          if (!account) throw new AccountNotFoundException(uniqueProperties.id);
          return account;
        }
      
}