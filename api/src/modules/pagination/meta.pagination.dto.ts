import { Type } from "class-transformer";
import { IsIn, IsInt, IsNumber, IsPositive, Min } from "class-validator";

export class MetaPaginationDto {
    @IsNumber()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    totalArticle: number

    @IsNumber()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    currentPage: number


    @IsNumber()
    @Type(() => Number)
    @IsPositive()
    @IsIn([2, 5, 10, 20])
    limit: number;


}