import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import fastifySecureSession from '@fastify/secure-session';
import fs from 'node:fs';
import { ValidationPipe } from '@nestjs/common';
import { PrismaService } from './commons/prisma/prisma.service';
import helmet from '@fastify/helmet';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ bodyLimit: 1048576 }),
  );

  await app.register(fastifySecureSession, {
    salt: 'mq9hDxBVDbspDR6n',
    key: process.env.SECRET_KEY ? Buffer.from(process.env.SECRET_KEY, 'base64') : fs.readFileSync('/app/secret-key'),
    cookie: {
      path: '/',
      httpOnly: true,
    },
  });

  app.get(PrismaService);
  await app.register(helmet);
  app.useGlobalPipes();

  const config = new DocumentBuilder()
    .setTitle('Blog')
    .setDescription('Api for blog !')
    .setVersion('1.0')
    .setBasePath('/api/')
    .build();

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      stopAtFirstError: true,
      validationError: {
        target: true,
        value: true,
      },
    }),
  );
  app.enableCors({
    origin: ['http://localhost:4200'],
    credentials: true,
  });

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  await app.listen(3000, "0.0.0.0");
}
bootstrap();

