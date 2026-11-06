import { ApiProperty } from "@nestjs/swagger"
import { IsDefined, IsEmail, IsEnum, IsInt, IsNumber, IsPositive, MaxLength, MinLength } from "class-validator"
import { Role } from "src/commons/roles/role.enum"

export class UserSessionDto {
    @ApiProperty({
        type: 'number',
        description: "L'identifiant unique de l'utilisateur.",
        example: 42
    })
    @IsDefined({
        message: "L'identifiant doit être défini.",
    })
    @IsInt({
        message: "L'identifiant doit être un nombre entier.",
    })
    @IsPositive({
        message: "L'identifiant doit être supérieur à zéro.",
    })
    id: number;

    @ApiProperty({
        type: 'string',
        description: "l'Email unique de l'utilisateur.",
        example: "johndoe42@gmail.com"
    })
    @IsDefined({
        message: "L'email doit être défini.",
    })
    @IsEmail({}, { message: "L'email n'est pas valide." })
    @MinLength(5, {
        message: "L'email doit avoir au minimum $constraint1 caractères.",
    })
    @MaxLength(255, {
        message: "L'email doit contenir au maximum $constraint1 caractères.",
    })
    email: string;
    @ApiProperty({
        enum: Role,
        enumName: "role",
        description: "Le role de l'utilisateur.",
        example: Role.User
    })
    @IsDefined({
        message: "Le rôle de l'utilisateur doit être défini."
    })
    @IsEnum(Role, {
        message: "Le rôle doit être l'une des valeurs suivantes : $constraint2."
    })
    role: Role
}