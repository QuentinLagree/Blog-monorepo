import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { FastifyRequest } from "fastify";
import { UserSession } from "src/commons/types/session-user.type";

export const CurrentUser = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): UserSession => {
        const request: FastifyRequest = ctx.switchToHttp().getRequest();
        const session = request.session.get('user');
        return session;
    }
)