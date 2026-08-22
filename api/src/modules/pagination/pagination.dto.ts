import { UsePipes } from "@nestjs/common";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { IsBoolean, isBoolean, IsBooleanString, IsIn, IsInt, IsNumber, IsNumberString, IsPositive, Min } from "class-validator";

export class PaginationDto {
    @ApiPropertyOptional({
    name: 'page',
    type: Number,
    example: 1,
    description: "Numéro de page",
  })
    @IsNumber()
    @Type(() => Number)
    @IsInt()
    @Min(1)

    page?: number = 1;

    @ApiPropertyOptional({
        name: 'limit',
        type: Number,
        example: 2,
        description: "Limite d'article à afficher",
      })
    @IsNumber()
    @Type(() => Number)
    @IsPositive()
    @IsIn([2, 5, 10, 20])
    limit?: number = 5;

    @ApiProperty({
    name: 'published?',
    type: Boolean,
    example: false,
    description: "Afficher les articles publiés ?",
  })
    @Transform(({ value }) => {
        if (value === true || value === 'true') return true;
        if (value === false || value === 'false') return false;

        return value
    })
    @IsBoolean()
    published?: boolean = false

    @ApiProperty({
    name: 'reading?',
    type: Boolean,
    example: true,
    description: "Afficher les articles déjà lu par l'utilisateur connecté ?",
  })
    @Transform(({ value }) => {
        if (value === true || value === 'true') return true;
        if (value === false || value === 'false') return false;

        return value
    })
    @IsBoolean({
        always: false
    })
    reading?: boolean = true

}