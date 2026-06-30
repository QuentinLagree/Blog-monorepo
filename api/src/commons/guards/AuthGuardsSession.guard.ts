import { CanActivate, ExecutionContext, UnauthorizedException, mixin } from "@nestjs/common";
import { FastifyRequest, FastifyReply } from "fastify";
import { makeMessage } from "../logger/logger.helper";
import { Message } from "../types/dto/message/message";
import { Url } from "../types/url.types";

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

        throw new UnauthorizedException(
          outputMessage
            ? makeMessage(
                outputMessage?.log ?? '',
                outputMessage.message,
                outputMessage.data,
              )
            : 'Session Invalid/Expired',
        );
      }

      return true;
    }
  }

  return mixin(UserGuardSession);
};