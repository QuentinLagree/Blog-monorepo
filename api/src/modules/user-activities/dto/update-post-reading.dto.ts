import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  Max,
  Min,
} from 'class-validator';

export class UpdatePostReadingDto {
  @IsInt({
    message: "La progression est un entier valide."
  })
  @Min(0, {
    message: "La progression doit être au minimum de 0%."
  })
  @Max(100, {
    message: "La progression doit pas dépassé 100%."
  })
  @ApiProperty({
    description: 'Progression entre 0 et 100%',
    example: 55,
    type: "number",
  })
  progress: number;
}