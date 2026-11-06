import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNumber, IsPositive } from "class-validator";

export class StatusLikeDto {
  @ApiProperty({
    description:"L'utilisateur a t-il liker l'article ?",
    type: "boolean",
    example: true
  })
  @IsBoolean({
    message: "Le statut du like doit être un booléen (true ou false)."
  })
  liked: boolean;
  @ApiProperty({
    description:"Nombre de likes que l'article à récolter.",
    type: "number",
    example: 2,
  })
  @IsNumber({
    allowInfinity: false,
    maxDecimalPlaces: 0
  }, {
    message: "Le nombre de like doit être un nombre entier."
  })
  @IsPositive({
    message: "Le nombre de like doit être au dessus de 0. Il ne peux pas être négatif."
  })
  likesCount: number;
}