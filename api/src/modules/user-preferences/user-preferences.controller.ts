// src/modules/user-preferences/user-preferences.controller.ts

import * as secureSession from '@fastify/secure-session';

import {
  Body,
  Controller,
  Get,
  Patch,
  Query,
  Session,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { AuthGuardSession } from 'src/commons/guards/AuthGuardsSession.guard';
import { makeMessage } from 'src/commons/logger/logger.helper';
import { Message } from 'src/commons/types/dto/message/message';

import { UserPreferenceService } from './user-preferences.service';
import { UserPreferenceQueryDto } from './dto/query-preferences.user.dto';
import { UpdateUserPreferenceDto } from './dto/update-preferences.user.dto';

@ApiTags('Préférences utilisateur')
@Controller('users/preferences')
@UseGuards(AuthGuardSession())
export class UserPreferenceController {
  constructor(
    private readonly _preferences: UserPreferenceService,
  ) {}  

  @Get()
  async getPreferences(
    @Query() query: UserPreferenceQueryDto,
    @Session() session: secureSession.Session,
  ): Promise<Message<Record<string, unknown>>> {
    const sessionUser = session.get('user');

    const preferences =
      await this._preferences.getPreferences(
        sessionUser.id,
        query.fields,
      );

    return makeMessage(
      'User preferences',
      'Préférences utilisateur récupérées.',
      preferences,
    );
  }

  @Patch()
  async updatePreferences(
    @Body() payload: UpdateUserPreferenceDto,
    @Session() session: secureSession.Session,
  ) {
    const sessionUser = session.get('user');

    console.log(payload)

    const preferences =
      await this._preferences.updatePreferences(
        sessionUser.id,
        payload,
      );

    return makeMessage(
      'User preferences updated',
      'Les préférences ont été mises à jour.',
      preferences,
    );
  }
}