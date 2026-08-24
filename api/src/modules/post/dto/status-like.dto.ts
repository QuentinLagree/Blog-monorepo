import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean } from "class-validator";

export class StatusLikeDto {
  @ApiProperty({
    description:"L'utilisateur a t-il liker l'article ?",
    type: "boolean",
    example: true
  })
  @IsBoolean()
  liked: boolean;
  @ApiProperty({
    description:"Nombre de likes que l'article à récolter.",
    type: "number",
    example: 2,
  })
  @IsBoolean()
  likesCount: number;
}