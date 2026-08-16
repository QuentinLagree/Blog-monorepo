import {
  IsInt,
  Max,
  Min,
} from 'class-validator';

export class UpdatePostReadingDto {
  @IsInt()
  @Min(0)
  @Max(100)
  progress: number;
}