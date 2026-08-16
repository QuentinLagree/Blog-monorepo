import { OmitType, PartialType, PickType } from "@nestjs/swagger";
import { IsDate, IsDateString, IsNotEmpty, IsNumber, IsPositive } from "class-validator";
import { PostsEntity } from "../entities/posts.entities";

export class PublishedPostDto {

    
    @IsDateString()
    @IsNotEmpty()
    published_at: Date;
    
}