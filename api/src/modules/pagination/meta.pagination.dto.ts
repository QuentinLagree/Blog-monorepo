import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsIn, IsInt, IsNumber, IsPositive, Min } from "class-validator";

export class MetaPaginationDto {
    @ApiProperty({
        description: "Nombre totale d'article retourné en réponse.",
        type: "number",
        example: 5,
    })
    @IsNumber({}, {
        message: "Le nombre total d'article est un entier valide."
    })
    @Type(() => Number)
    @IsInt()
    totalArticle: number

    @ApiProperty({
        description: "La page actuelle.",
        type: "number",
        example: 1,
    })
    @IsNumber({}, {
        message: "Le numéro de la page actuelle est un entier valide."
    })
    @Type(() => Number)
    @IsInt()
    @Min(1, {
        message: "La page courante, ne doit pas être inférieur à $constraint1 caractères."
    })
    currentPage: number


    
    @ApiProperty({
        description: "Nombre d'article à afficher.",
        type: "number",
        example: 2,
    })
    @IsNumber({}, {
        message: "La nombre d'objet affiché doit être un nombre entier."
    })
    @Type(() => Number)
    @IsPositive({
        message: "La limite ne peux pas être négative."
    })
    @IsIn([2, 5, 10, 20], {
        message: "La limite d'article affiché doit être parmi les valeurs suivantes : $constraint1."
    })
    limit: number;
}