import helmet from '@fastify/helmet';
import fastifySecureSession from '@fastify/secure-session';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import fs from 'node:fs';
import { AppModule } from './app.module';
import { ErrorValidationPipeException } from './commons/exceptions/error-validation-pipe.exception';
import { PrismaExceptionFilter } from './commons/filters/prisma.filter';
import { PrismaService } from './commons/prisma/prisma.service';
import { MessageValidationError } from './commons/types/dto/message/validation-error-message';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ bodyLimit: 1048576 }),
  );

  await app.register(fastifySecureSession, {
    salt: 'mq9hDxBVDbspDR6n',
    key: process.env['SECRET_KEY'] ? Buffer.from(process.env['SECRET_KEY'], 'base64') : fs.readFileSync('/app/secret-key'),
    cookie: {
      path: '/',
      httpOnly: true,
    },
  });

  app.get(PrismaService);
  await app.register(helmet);
  app.useGlobalPipes();
  app.useGlobalFilters(new PrismaExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('Blog')
    .setDescription('Api for blog !')
    .setVersion('1.0')
    .addCookieAuth('session')
    .build();

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      stopAtFirstError: true,
      validationError: {
        target: false,
        value: false
      },
      exceptionFactory: (errors: Omit<MessageValidationError[], 'children'>) => {
      return new ErrorValidationPipeException(errors.map(({ property, constraints }) => ({property, constraints})));
    },
    }),
  );
  app.enableCors({
    origin: ['http://localhost:4200'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  });

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  await app.listen(3000, "0.0.0.0");
}
bootstrap();

