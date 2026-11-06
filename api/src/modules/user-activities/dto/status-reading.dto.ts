import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNumber, Max, Min } from "class-validator";

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
  @IsBoolean({
    message: "La complétion de l'article doit être un booléen (true ou false)"
  })
  completed: boolean;
  @ApiProperty({
    description: "Progrès de lecture de l'article de 0% à 100%, à 95% l'article a été lu.",
    example: 55,
    type: "number"
  })
  @IsNumber()
  @Min(0, {
    message: "La progression doit être au minimum à $constraint1%."
  })
  @Max(100, {
    message: "La progression doit être au maximum à $constraint1%."
  })
  progress: number;
};