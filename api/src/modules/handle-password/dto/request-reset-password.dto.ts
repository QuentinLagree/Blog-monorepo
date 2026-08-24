import { ApiProperty, PickType } from "@nestjs/swagger";
import { ResetPasswordDto } from "./reset-password.dto";
import { IsString } from "class-validator";

export class RequestResetPasswordDto extends PickType(ResetPasswordDto, ["email"] as const) {
    @ApiProperty()
    @IsString()
    token: string
}