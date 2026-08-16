import { PickType } from "@nestjs/swagger";
import { ResetPasswordDto } from "./reset-password.dto";

export class RequestResetPasswordDto extends PickType(ResetPasswordDto, ["email", "token"] as const) {}