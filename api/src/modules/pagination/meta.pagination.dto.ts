import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsIn, IsInt, IsNumber, IsPositive, Min } from "class-validator";

export class MetaPaginationDto {
    @ApiProperty({
        description: "Nombre totale d'article retourné en réponse.",
        type: "number",
        example: 5,
    })
    @IsNumber()
    @Type(() => Number)
    @IsInt()
    totalArticle: number

    @ApiProperty({
        description: "La page actuelle.",
        type: "number",
        example: 1,
    })
    @IsNumber()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    currentPage: number


    
    @ApiProperty({
        description: "Nombre d'article à afficher.",
        type: "number",
        example: 2,
    })
    @IsNumber()
    @Type(() => Number)
    @IsPositive()
    @IsIn([2, 5, 10, 20])
    limit: number;


}