import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNumber, Min } from "class-validator";

export class StatusReadingDto {
  @ApiProperty({
    description: "Vrai si l'utilisateur à commencer la lecture de l'article.",
    example: true,
    type: "boolean"
  })
  @IsBoolean()
  hasStarted: boolean;
  @ApiProperty({
    description: "Vrai si l'utilisateur à terminer la lecture de l'article.",
    example: true,
    type: "boolean"
  })
  @IsBoolean()
  completed: boolean;
  @ApiProperty({
    description: "Progrès de lecture de l'article de 0% à 100%, à 95% l'article a été lu.",
    example: 55,
    type: "number"
  })
  @IsNumber()
  @Min(0)
  @Min(100)
  progress: number;
};