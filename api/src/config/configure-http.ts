import helmet from '@fastify/helmet';
import secureSession from '@fastify/secure-session';
import { ValidationPipe } from '@nestjs/common';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import fs from 'node:fs';
import { ErrorValidationPipeException } from '../commons/exceptions/error-validation-pipe.exception';
import { PrismaExceptionFilter } from '../commons/filters/prisma.filter';
import { MessageValidationError } from '../commons/types/dto/message/validation-error-message';
import { configureRequestSecurity } from './request-security';

// Shared by bootstrap and HTTP tests so validation and filters cannot drift.
export async function configureHttp(
  app: NestFastifyApplication,
): Promise<void> {
  const production = process.env['NODE_ENV'] === 'production';
  if (production) {
    for (const name of [
      'SECRET_KEY',
      'FRONTEND_URL',
      'DATABASE_URL',
      'REDIS_URL',
    ]) {
      if (!process.env[name])
        throw new Error(`Missing required production configuration: ${name}`);
    }
    if (new URL(process.env['FRONTEND_URL']!).protocol !== 'https:') {
      throw new Error('FRONTEND_URL must use HTTPS in production.');
    }
  }
  const frontend = new URL(
    process.env['FRONTEND_URL'] ?? 'http://localhost:4200',
  ).origin;
  await app.register(secureSession, {
    salt: 'mq9hDxBVDbspDR6n',
    key: process.env['SECRET_KEY']
      ? Buffer.from(process.env['SECRET_KEY'], 'base64')
      : fs.readFileSync('/app/secret-key'),
    cookie: { path: '/', httpOnly: true, sameSite: 'lax', secure: production },
  });
  await app.register(helmet);
  configureRequestSecurity(app);
  app.useGlobalFilters(new PrismaExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      stopAtFirstError: true,
      validationError: { target: false, value: false },
      exceptionFactory: (errors: Omit<MessageValidationError[], 'children'>) =>
        new ErrorValidationPipeException(
          errors.map(({ property, constraints }) => ({
            property,
            constraints,
          })),
        ),
    }),
  );
  app.enableCors({
    origin: [frontend],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  });
}
