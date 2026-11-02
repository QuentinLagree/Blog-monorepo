import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNumber } from "class-validator";

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
  @IsNumber()
  likesCount: number;
}