import { ApiProperty, PickType } from "@nestjs/swagger";
import { ResetPasswordDto } from "./reset-password.dto";
import { IsString } from "class-validator";

export class RequestResetPasswordDto extends PickType(ResetPasswordDto, ["email"] as const) {
    @ApiProperty({
        name: "token",
        description: "Token de validation. Il est unique et est composé de 32 caractères avec une clé crypté."
    })
    @IsString()
    token: string
}