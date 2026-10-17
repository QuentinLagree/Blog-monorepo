import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, isString, MinLength } from "class-validator";

export class TempDto {
    @IsString()
    @IsNotEmpty()
    @IsEmail()
    email: string

    @IsString()
    @MinLength(5)
    password: string

    @IsOptional()
    role: string
}