import {
  Controller,
  Get,
  Inject,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import Redis from 'ioredis';
import { Message } from '../types/dto/message/message';
import { makeMessage } from '../helpers/logger.helper';
import { AuthGuardSession } from '../guards/AuthGuardsSession.guard';
import { Url } from '../types/url.types';
import { REDIS } from './redis.token';

@ApiTags('Serveur Redis')
@Controller('redis')
export class RedisController {

    constructor (
        @Inject(REDIS) private readonly _redis: Redis
    ) {}
    
  @Get('status')
  @UseGuards(AuthGuardSession(new Url("/"), {
    message: "Tu n'es pas autoriser à acceder à cette ressource.",
    data: null
  }))
  async health(): Promise<Message<"wait" | "reconnecting" | "connecting" | "connect" | "ready" | "close" | "end">> {
    return makeMessage('Redis Status', "Récupération du status de Redis", this._redis.status);
  }
}
