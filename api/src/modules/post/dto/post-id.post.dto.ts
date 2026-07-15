import { IsDefined, IsNumber } from "class-validator";

export class PostId {
    @IsDefined()
    @IsNumber()
    post_id: number
}