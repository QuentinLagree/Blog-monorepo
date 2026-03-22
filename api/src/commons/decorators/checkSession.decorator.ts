import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';

export interface SessionData {
  user: any;
}

type UserRedirecter = {
  sessionId: keyof SessionData;
  urlToRedirect: string;
};
export const RedirectIfNotConnected = createParamDecorator(
  (data: UserRedirecter, ctx: ExecutionContext) => {
    let session = (
      ctx.switchToHttp().getRequest() as FastifyRequest
    ).session.get(data.sessionId);
    if (session == undefined) {
      (ctx.switchToHttp().getResponse() as FastifyReply).redirect(
        data.urlToRedirect,
      );
      return false;
    }
    return true;
  },
);
