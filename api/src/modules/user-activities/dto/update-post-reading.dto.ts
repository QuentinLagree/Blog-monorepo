import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  Max,
  Min,
} from 'class-validator';

export class UpdatePostReadingDto {
  @IsInt()
  @Min(0)
  @Max(100)
  @ApiProperty({
    description: 'Progression entre 0 et 100%',
    example: 55,
    type: "number",
  })
  progress: number;
}