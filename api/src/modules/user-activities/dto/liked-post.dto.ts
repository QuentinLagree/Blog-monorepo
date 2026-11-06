import { ApiProperty } from "@nestjs/swagger";
import { IsDefined, IsNumber } from "class-validator";

export class LikedPostDto {
    @ApiProperty({
        name: "user_id",
        description: 'Identifiant unique de l\'utilisateur.',
        type: Number,
        example: 1
    })
    @IsNumber()
    @IsDefined()
    user_id: number;
    @ApiProperty({
        name: "post_id",
        description: 'Identifiant unique de la publication.',
        type: Number,
        example: 1
    })
    @IsNumber()
    @IsDefined()
    post_id: number;
}