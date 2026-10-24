import { IsDateString, IsNotEmpty } from "class-validator";

export class PublishedPostDto {

    @IsDateString()
    @IsNotEmpty()
    published_at: Date;
}