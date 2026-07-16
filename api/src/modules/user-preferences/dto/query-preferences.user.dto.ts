import {
  IsOptional,
  IsString,
} from 'class-validator';

export class UserPreferenceQueryDto {
  @IsOptional()
  @IsString()
  fields?: string;
}