import { Controller, Get } from "@nestjs/common";
import { ApiCookieAuth, ApiTags } from "@nestjs/swagger";
import { makeMessage } from "src/commons/logger/logger.helper";
import { Message } from "src/commons/types/dto/message/message";
import { getDtoPropertyPriority } from "src/commons/types/dto/temp/metadata";
import { UserSession } from "src/commons/types/session-user.type";
import { SessionType } from "src/commons/types/session.type";
import { UnauthorizedSessionInactive } from "../auth/exceptions/unautorisation-session-inactive.exception";
import { MetaPaginationDto } from "../pagination/meta.pagination.dto";
import { CreatePostDto } from "../post/dto/create.post.dto";
import { PostSummaryDto } from "../post/dto/post-summary.dto";
import { ArticleService } from "../post/posts.service";
import { UserService } from "../user/user.service";
import { CurrentUser } from "./decorators/current.decorator";
import { ApiExceptionsResponse } from "src/commons/decorators/api-exception-response.decorator";
import { UserNotFoundException } from "../user/exceptions/user-not-found.exception";
import { UserNotHaveAuthorisation } from "../user/exceptions/user-not-have-authorization";
import { EmailOrPasswordNotMatchException } from "../auth/exceptions/email-or-password-not-match.exception";
import { PostNotFoundException } from "../post/exceptions/post-not-found.exception";
import { CreatePostFailException } from "src/commons/exceptions/create-post-fail.exception";
import { UpdatePostFailException } from "src/commons/exceptions/update-post-fail.exception";

@ApiCookieAuth()
// TODO @UseGuards(AuthGuardSession())
@ApiTags("Mon compte")
@Controller('/me')
export class MeController {

    constructor(
        private readonly _user: UserService,
        private readonly _articles: ArticleService,
    ) { }
    @ApiExceptionsResponse([UserNotFoundException, UserNotHaveAuthorisation, EmailOrPasswordNotMatchException, PostNotFoundException, CreatePostFailException, UpdatePostFailException])
    @Get('metadata')
    async getMetaData () {
      return getDtoPropertyPriority(CreatePostDto)
    }

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
