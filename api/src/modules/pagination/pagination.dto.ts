import { Type } from "class-transformer";
import { IsBoolean, isBoolean, IsIn, IsInt, IsNumber, IsNumberString, IsPositive, Min } from "class-validator";

export class PaginationDto {
    @IsNumber()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    
    page?: number = 1;

    @IsNumber()
    @Type(() => Number)
    @IsPositive()
    @IsIn([2, 5, 10, 20])
    limit?: number = 5;

    @IsBoolean()
    @Type(() => Boolean)
    published: boolean = false
}