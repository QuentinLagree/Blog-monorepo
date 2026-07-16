import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateUserPreferenceDto {
  @ApiPropertyOptional({
    enum: ['light', 'dark', 'system'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['light', 'dark', 'system'])
  theme?: string;

  @ApiPropertyOptional({
    enum: ['fr', 'en'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['fr', 'en'])
  language?: string;

  @ApiPropertyOptional({
    enum: ['small', 'medium', 'large'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['small', 'medium', 'large'])
  fontSize?: string;

  @IsOptional()
  @IsBoolean()
  reduceAnimations?: boolean;

  @IsOptional()
  @IsBoolean()
  showReadingTime?: boolean;

  @IsOptional()
  @IsBoolean()
  showAuthorDetails?: boolean;

  @IsOptional()
  @IsBoolean()
  hideReadPosts?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyOnLike?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyOnContribution?: boolean;

  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  newsletter?: boolean;

  @IsOptional()
  @IsBoolean()
  profileVisible?: boolean;

  @IsOptional()
  @IsBoolean()
  showLikedPosts?: boolean;

  @IsOptional()
  @IsBoolean()
  showContributions?: boolean;
}