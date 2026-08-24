import { Transform } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsOptional,
} from 'class-validator';
import { USER_PREFERENCE_FIELDS, UserPreferenceField } from '../helper/user.preferences.fields';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserPreferencesOutput{
  @ApiProperty({
    description: "Forme de données renvoyé en message.",
    example: {"theme": "system", "fontSize": "medium"}
  })
  preferences: Record<string, unknown>
}

export class UserPreferenceQueryDto {
  @ApiPropertyOptional({
    enum: USER_PREFERENCE_FIELDS,
    isArray: true,
    description: 'Préférences à récupérer.',
    example: ['theme', 'fontSize'],
  })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string'
      ? value.split(',')
      : value
  )
  @IsArray()
  @IsIn(USER_PREFERENCE_FIELDS, { each: true })
  fields?: UserPreferenceField[];
}