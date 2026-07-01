import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { Prisma } from '@prisma/client';
import { makeMessage } from '../logger/logger.helper';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(
    exception: Prisma.PrismaClientKnownRequestError,
    host: ArgumentsHost,
  ) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();

    switch (exception.code) {
      case 'P2002':
        return response.status(HttpStatus.CONFLICT).send(
          makeMessage(
            'Unique constraint failed',
            'Une donnée existe déjà avec ces informations.',
            exception.meta,
          ),
        );

      case 'P2025':
        return response.status(HttpStatus.NOT_FOUND).send(
          makeMessage(
            'Record not found',
            "La ressource demandée n'existe pas.",
            null,
          ),
        );

      case 'P2003':
        return response.status(HttpStatus.BAD_REQUEST).send(
          makeMessage(
            'Foreign key constraint failed',
            "La ressource liée n'existe pas.",
            exception.meta,
          ),
        );

      default:
        return response.status(HttpStatus.INTERNAL_SERVER_ERROR).send(
          makeMessage(
            'Database Error',
            "Une erreur est survenue avec la base de données.",
            null,
            { level: 'Fatal' },
          ),
        );
    }
  }
}