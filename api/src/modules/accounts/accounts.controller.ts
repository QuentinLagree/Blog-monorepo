import { ClassSerializerInterceptor, Controller, Get, HttpCode, HttpException, HttpStatus, NotFoundException, Param, UseInterceptors } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { TransformDataInterceptor } from "src/commons/interceptors/transform_data.interceptor";
import { AccountEntity } from "./entities/account.entities";
import { AccountService } from "./accounts.service";
import { Account } from "@prisma/client";
import { makeMessage } from "src/commons/helpers/logger.helper";
import { Message } from "src/commons/types/message/message";
import { ID } from "src/commons/types/id.types";

@ApiTags("Compte Utilisateur")
@UseInterceptors(ClassSerializerInterceptor)
@UseInterceptors(new TransformDataInterceptor(AccountEntity))
@Controller('accounts')
export class AccountController {

    constructor(
        private readonly _account: AccountService
    ) { }

    @Get('/')
    @HttpCode(200)
    async index() {
        try {
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
        } catch (error) {
            switch (true) {
                default:
                    throw new HttpException(
                        makeMessage(
                            'Fatal Error',
                            "Une erreur est survenue, essayer de contacter l'administrateur ou réessayer ultérieurement.",
                            error,
                            { level: 'Fatal' },
                        ),
                        HttpStatus.INTERNAL_SERVER_ERROR,
                    );
            }
        }
    }

    @Get('/:id')
      async show(@Param('id') id: number): Promise<Message<Account | null>> {
        if (!ID.hasValid(id))
          throw new HttpException(
            makeMessage(
              `Error Param ID : '${id}' is invalid.`,
              "L'id doit être un nombre entier.",
              null,
            ),
            HttpStatus.BAD_REQUEST,
          );
    
        let type_id = ID.add(id);
        try {
          const account = await this._account.show({ id: type_id.value() });
          return makeMessage(
            `User's Account found with ID: ${account.id}!`,
            `Le compte utilisateur ${account.id} a bien été trouvé.`,
            account,
          );
        } catch (error) {
          switch (true) {
            case error instanceof NotFoundException:
              throw new HttpException(
                makeMessage(
                  `Account Not Found with id ${type_id.value()}`,
                  `Le compte utilisateur ${type_id.value()} n'a pas été trouvé.`,
                  null,
                ),
                HttpStatus.NOT_FOUND,
              );
    
            default:
              throw new HttpException(
                makeMessage(
                  'Fatal Error',
                  "Une erreur est survenue, essayer de contacter l'administrateur ou réessayer ultérieurement.",
                  error,
                  { level: 'Fatal' },
                ),
                HttpStatus.INTERNAL_SERVER_ERROR,
              );
          }
        }
      }

}