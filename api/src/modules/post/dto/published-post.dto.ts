import { OmitType, PartialType, PickType } from "@nestjs/swagger";
import { IsDate, IsDateString, IsNotEmpty, IsNumber, IsPositive } from "class-validator";
import { PostsEntity } from "../entities/posts.entities";

export class PublishedPostDto extends PartialType(
    PickType(PostsEntity, ['id', 'published_at'] as const)) {
    
    @IsNotEmpty()
    @IsNumber()
    @IsPositive()
    override id: number;

    
    @IsDateString()
    @IsNotEmpty()
    override published_at: Date;
    
}