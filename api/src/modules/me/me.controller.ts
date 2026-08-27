import { Controller, Get, HttpException, HttpStatus, Query, Res, UseGuards } from "@nestjs/common";
import { ApiCookieAuth, ApiTags } from "@nestjs/swagger";
import { UserService } from "../user/user.service";
import { CurrentUser } from "./decorators/current.decorator";
import { AuthGuardSession } from "src/commons/guards/AuthGuardsSession.guard";
import { UserSession } from "src/commons/types/session-user.type";
import { PaginationDto } from "../pagination/pagination.dto";
import { Post as Articles } from '@prisma/client';
import { Message } from "src/commons/types/dto/message/message";
import { MetaPaginationDto } from "../pagination/meta.pagination.dto";
import { ArticleService } from "../post/posts.service";
import { makeMessage } from "src/commons/logger/logger.helper";
import { PostSummaryDto } from "../post/dto/post-summary.dto";
import { SessionType } from "src/commons/types/session.type";
import { UnauthorizedSessionInactive } from "../auth/exceptions/unautorisation-session-inactive.exception";

@ApiCookieAuth()
@UseGuards(AuthGuardSession())
@ApiTags("Mon compte")
@Controller('/me')
export class MeController {

    constructor(
        private readonly _user: UserService,
        private readonly _articles: ArticleService,
    ) { }

    @Get()
      async status(
        @CurrentUser() user,
      ): Promise<Message<SessionType>> {
        if (user) {
          return makeMessage('', 'La session est bien active.', {
            loggedIn: true,
            user,
          });
        } else {
          throw new UnauthorizedSessionInactive();
        }
      }
    
    @Get("/posts")
    async index(@CurrentUser() user: UserSession,
    ): Promise<Message<PostSummaryDto[], MetaPaginationDto>> {
        const posts = await this._articles.indexWhere({ authorId: user.id });

        return posts.length === 0
            ? makeMessage<PostSummaryDto[], MetaPaginationDto>(
                'List of all posts is empty.',
                'La liste de vos publications est vide',
                [],
            )
            : makeMessage<PostSummaryDto[], MetaPaginationDto>(
                'List of all posts',
                'Liste de toutes vos les publications',
                posts,
            );
    }

    /**
     * 
     * Me: Toute action effectué pour l'utilisateur actuel :
     * - Créer un décorateur pour récupérer l'utilisateur courant.
     * - 
     * Qu'est-ce que le propriétaire du compte peut faire :
     *
     *  - Récupérer ses articles
     * - 
     * 
     * 
     * 
     */

}
