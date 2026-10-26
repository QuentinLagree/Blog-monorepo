import {
  Controller,
  Get,
  Inject,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import Redis from 'ioredis';
import { createAuthGuardSession } from '../guards/AuthGuardsSession.guard';
import { makeMessage } from '../logger/logger.helper';
import { Message } from '../types/dto/message/message';
import { Url } from '../types/url.types';
import { REDIS } from './redis.token';

@ApiTags('Serveur Redis')
@Controller('redis')
export class RedisController {

    constructor (
        @Inject(REDIS) private readonly _redis: Redis
    ) {}
    
  @Get('status')
  @UseGuards(createAuthGuardSession(new Url("/")))
  async health(): Promise<Message<"wait" | "reconnecting" | "connecting" | "connect" | "ready" | "close" | "end">> {
    return makeMessage('Redis Status', "Récupération du status de Redis", this._redis.status);
  }
}
