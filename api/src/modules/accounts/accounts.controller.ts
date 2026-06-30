import { ClassSerializerInterceptor, Controller, Get, HttpCode, HttpException, HttpStatus, NotFoundException, Param, ParseIntPipe, UseGuards, UseInterceptors } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { TransformDataInterceptor } from "src/commons/interceptors/transform_data.interceptor";
import { AccountEntity } from "./entities/account.entities";
import { AccountService } from "./accounts.service";
import { Account } from "@prisma/client";
import { makeMessage } from "src/commons/logger/logger.helper";
import { Message } from "src/commons/types/dto/message/message";
import { AuthGuardSession } from "src/commons/guards/AuthGuardsSession.guard";
import { RolesGuard } from "src/commons/guards/role.guard";
import { Roles } from "src/commons/decorators/role.decorator";
import { Role } from "src/commons/roles/role.enum";

@ApiTags("Compte Utilisateur")
@UseInterceptors(ClassSerializerInterceptor)
@UseInterceptors(new TransformDataInterceptor(AccountEntity))
@Controller('accounts')
export class AccountController {

    constructor(
        private readonly _account: AccountService
    ) { }

    @UseGuards(AuthGuardSession(), RolesGuard)
    @Roles(Role.Admin)
    @Get('/')
    @HttpCode(200)
    async index() {
      const accounts: Account[] = await this._account.index();
      return accounts.length == 0
          ? makeMessage(
              'List of all accounts is empty.',
              'La liste des comptes utilisateur est vide',
              null,
          )
          : makeMessage(
              'List of all accounts',
              'Liste de tous les comptes utilisateur',
              accounts,
          );
    }

    @Get('/:id')
      async show(@Param('id', ParseIntPipe) id: number): Promise<Message<Account | null>> {
          const account = await this._account.show({ id: id });
          return makeMessage(
            `User's Account found with ID: ${account.id}!`,
            `Le compte utilisateur ${account.id} a bien été trouvé.`,
            account,
          );
      }

}