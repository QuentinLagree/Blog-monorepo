// src/modules/user-preferences/user-preferences.controller.ts

import * as secureSession from '@fastify/secure-session';

import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  Session,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiCookieAuth, ApiOperation, ApiQuery, ApiTags, getSchemaPath } from '@nestjs/swagger';

import { AuthGuardSession } from 'src/commons/guards/AuthGuardsSession.guard';
import { makeMessage } from 'src/commons/logger/logger.helper';
import { Message } from 'src/commons/types/dto/message/message';

import { UserPreferenceService } from './user-preferences.service';
import { UserPreferenceQueryDto, UserPreferencesOutput } from './dto/query-preferences.user.dto';
import { UpdateUserPreferenceDto } from './dto/update-preferences.user.dto';
import { USER_PREFERENCE_FIELDS } from './helper/user.preferences.fields';
import { ApiMessageResponse } from 'src/commons/decorators/api-message-response.decorator';
import { ApiExceptionsResponse } from 'src/commons/decorators/api-exception-response.decorator';
import { UserNotHaveAuthorisation } from '../user/exceptions/user-not-have-authorization';
import { UserSession } from 'src/commons/types/session-user.type';
import { CurrentUser } from '../me/decorators/current.decorator';
import { InvalidPreferenceFieldException } from './exceptions/invalid-preference-field.exception';

@ApiCookieAuth()
@ApiTags('Préférences')
@Controller('users/preferences')
@UseGuards(AuthGuardSession())
export class UserPreferenceController {
  constructor(
    private readonly _preferences: UserPreferenceService,
  ) { }

  @ApiOperation({
    summary: 'Récupérer la ou les préférence de l\'utilisateur.',
    description: "Récupère toutes les préférences que l'utilisateur souhaite (grâce à la query fields) Ou récupère toutes les préférences si rien n'est indiqué. Il faut être connecté pour effectuer cette action."
  })
  @ApiQuery({
  name: 'fields',
  required: false,
  enum: USER_PREFERENCE_FIELDS,
  isArray: true,
  description: 'Préférences à récupérer.',
})
@ApiMessageResponse(UserPreferencesOutput, {
  description: "Récupérer les ou la préférence de l'utilisateur.",
  messageExemple: "Préférences utilisateur récupérées."
})
@ApiExceptionsResponse([
  UserNotHaveAuthorisation,
  InvalidPreferenceFieldException
])
  @Get()
async getPreferences(
  @Query() query: UserPreferenceQueryDto,
  @CurrentUser() user: UserSession
): Promise<Message<UserPreferencesOutput>> {
  const preferences = await this._preferences.getPreferences(
    user.id,
    query.fields,
  );

  return makeMessage<UserPreferencesOutput>(
    'User preferences',
    'Préférences utilisateur récupérées.',
    {preferences},
  );
}

@ApiOperation({
    summary: 'Modifier la ou les préférence de l\'utilisateur.',
    description: "Modifier les préférences de l'utilisateur. Il faut être connecté pour effectuer cette action."
  })
  @ApiMessageResponse(UserPreferencesOutput, {
  description: "Récupérer les ou la préférence de l'utilisateur.",
  messageExemple: "Préférences utilisateur récupérées."
})
@ApiExceptionsResponse([
  UserNotHaveAuthorisation,
  InvalidPreferenceFieldException
])
@ApiBody({
  type: UpdateUserPreferenceDto,
  required: false,
  enum: USER_PREFERENCE_FIELDS,
  isArray: true,
  description: 'Préférences à modifier.',
})
  @Patch()
  async updatePreferences(
    @Body() payload: UpdateUserPreferenceDto,
    @CurrentUser() user: UserSession,
  ): Promise<Message<UserPreferencesOutput>> {
    const preferences =
      await this._preferences.updatePreferences(
        user.id,
        payload,
      );

    return makeMessage(
      'User preferences updated',
      'Les préférences ont été mises à jour.',
      {preferences},
    );
  }
}