import { CanActivate, ExecutionContext, UnauthorizedException, mixin } from "@nestjs/common";
import { FastifyRequest, FastifyReply } from "fastify";
import { makeMessage } from "../logger/logger.helper";
import { Message } from "../types/dto/message/message";
import { Url } from "../types/url.types";
import { UnauthorizedSessionInactive } from "src/modules/auth/exceptions/unautorisation-session-inactive.exception";

export const AuthGuardSession = (
  urlRedirect?: Url,
  outputMessage?: Message<any>,
) => {
  class UserGuardSession implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
      const request: FastifyRequest = context.switchToHttp().getRequest();
      const response: FastifyReply = context.switchToHttp().getResponse();

      const sessionUser = request.session['user'];

      if (!sessionUser) {
        if (urlRedirect) {
          response.redirect(urlRedirect.value());
          return false;
        }

        throw new UnauthorizedSessionInactive();
      }

      return true;
    }
  }

  return mixin(UserGuardSession);
};