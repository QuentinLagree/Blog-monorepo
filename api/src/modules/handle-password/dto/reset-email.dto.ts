import { PickType } from "@nestjs/swagger";
import { ResetPasswordDto } from "./reset-password.dto";

export class ResetEmailDto extends PickType(ResetPasswordDto, ["email"] as const) {}