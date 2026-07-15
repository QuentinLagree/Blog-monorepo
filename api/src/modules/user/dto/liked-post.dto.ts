import { IsDefined, isDefined, IsNumber } from "class-validator";

export class LikedPostDto {
    @IsNumber()
    @IsDefined()
    user_id: number;
    @IsNumber()
    @IsDefined()
    post_id: number;
}