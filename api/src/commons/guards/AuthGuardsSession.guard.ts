import { CanActivate, ExecutionContext, mixin } from "@nestjs/common";
import { FastifyRequest, FastifyReply } from "fastify";
import { Url } from "../types/url.types";
import { UnauthorizedSessionInactive } from "src/modules/auth/exceptions/unautorisation-session-inactive.exception";

export const createAuthGuardSession = (
  urlRedirect?: Url,
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