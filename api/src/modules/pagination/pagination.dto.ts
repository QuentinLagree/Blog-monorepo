import { UsePipes } from "@nestjs/common";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { IsBoolean, isBoolean, IsBooleanString, IsIn, IsInt, IsNumber, IsNumberString, IsPositive, Min } from "class-validator";

export class PaginationDto {
    @ApiPropertyOptional()
    @IsNumber()
    @Type(() => Number)
    @IsInt()
    @Min(1)

    page?: number = 1;

    @ApiPropertyOptional()
    @IsNumber()
    @Type(() => Number)
    @IsPositive()
    @IsIn([2, 5, 10, 20])
    limit?: number = 5;

    @ApiProperty({
        default: 'false'
    })
    @Transform(({ value }) => {
        if (value === true || value === 'true') return true;
        if (value === false || value === 'false') return false;

        return value
    })
    @IsBoolean()
    published?: boolean = false

    @ApiProperty({
        default: 'true'
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