import { createHash, randomUUID } from 'node:crypto';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { FastifyRequest } from 'fastify';
import type Redis from 'ioredis';
import { PrismaService } from '../commons/prisma/prisma.service';
import { sessionVersion } from '../commons/services/session-version';
import { ServiceUnavailableException } from '@nestjs/common';
import { REDIS_HTTP } from '../commons/redis/redis.token';

const incrementWindow = `
local count = redis.call('INCR', KEYS[1])
if count == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]) end
return {count, redis.call('PTTL', KEYS[1])}
`;

export async function consumeRequestLimit(
  redis: Redis,
  key: string,
  limit: number,
  windowMs: number,
): Promise<number> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const [count, ttl] = await Promise.race([
      redis.eval(incrementWindow, 1, key, windowMs) as Promise<
        [number, number]
      >,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () =>
            reject(
              new ServiceUnavailableException(
                'Protection temporairement indisponible.',
              ),
            ),
          1500,
        );
      }),
    ]);
    return count > limit ? Math.max(1, Math.ceil(ttl / 1000)) : 0;
  } finally {
    clearTimeout(timer);
  }
}

export function configureRequestSecurity(app: NestFastifyApplication): void {
  const prisma = app.get(PrismaService);
  const redis = app.get<Redis>(REDIS_HTTP);
  const test = process.env['NODE_ENV'] === 'test';
  // Isolated test applications must not share counters across suites or runs.
  const namespace = test ? `security:test:${randomUUID()}` : 'security:v1';
  const policies: Record<
    string,
    { ip: number; account?: number; window: number }
  > = {
    '/auth/login': { ip: 20, account: 10, window: 60_000 },
    '/auth/register': { ip: 5, window: 60_000 },
    '/users': { ip: 5, window: 60_000 },
    '/password/forgot': { ip: 5, account: 3, window: 900_000 },
    '/password/reset': { ip: 10, account: 5, window: 60_000 },
  };
  app
    .getHttpAdapter()
    .getInstance()
    .addHook('preHandler', async (request: FastifyRequest, reply) => {
      const route = request.routeOptions.url;
      const policy = request.method === 'POST' ? policies[route] : undefined;
      if (policy) {
        // Normal functional suites use higher limits; dedicated tests can use production limits.
        const multiplier =
          test && process.env['E2E_REAL_RATE_LIMITS'] !== 'true' ? 1000 : 1;
        const body = request.body as { email?: unknown } | undefined;
        const account =
          typeof body?.email === 'string'
            ? body.email.trim().toLowerCase()
            : undefined;
        const identities = [{ id: `ip:${request.ip}`, limit: policy.ip }];
        if (account && policy.account)
          identities.push({ id: `account:${account}`, limit: policy.account });
        for (const identity of identities) {
          const digest = createHash('sha256').update(identity.id).digest('hex');
          let retry: number;
          try {
            retry = await consumeRequestLimit(
              redis,
              `${namespace}:${route}:${digest}`,
              identity.limit * multiplier,
              policy.window,
            );
          } catch {
            reply.header('Retry-After', '2').code(503).send({
              statusCode: 503,
              message: 'Protection temporairement indisponible.',
            });
            return;
          }
          if (retry) {
            reply.header('Retry-After', String(retry)).code(429).send({
              statusCode: 429,
              message: 'Trop de tentatives. Réessayez plus tard.',
            });
            return;
          }
        }
      }

      const user = request.session.get('user');
      if (!user) return;
      const current = await prisma.user.findUnique({
        where: { id: user.id },
        select: { id: true, email: true, role: true, password: true },
      });
      if (
        !current ||
        user.credentialVersion !== sessionVersion(current.password)
      ) {
        // delete() expires the cookie but keeps its data available during this request.
        request.session.set('user', null);
        request.session.delete();
        return;
      }
      request.session.set('user', {
        id: current.id,
        email: current.email,
        role: current.role,
        credentialVersion: user.credentialVersion,
      });
    });
}
