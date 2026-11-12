import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { configureHttp } from './config/configure-http';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      bodyLimit: 1048576,
      trustProxy:
        process.env['TRUSTED_PROXY']
          ?.split(',')
          .map((value) => value.trim())
          .filter(Boolean) ?? false,
    }),
  );

  await configureHttp(app);
  app.enableShutdownHooks(['SIGTERM', 'SIGINT']);

  const config = new DocumentBuilder()
    .setTitle('Blog')
    .setDescription('Api for blog !')
    .setVersion('1.0')
    .addCookieAuth('session')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  await app.listen(Number(process.env['PORT'] ?? 3000), '0.0.0.0');
}
bootstrap();
