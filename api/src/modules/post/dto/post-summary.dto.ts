import { OmitType, PartialType } from "@nestjs/swagger";
import { Articles } from "./posts.dto";

export class PostSummaryDto extends PartialType(OmitType(Articles, ["content", "created_at", "author"] as const)) {
    author?: { id: number; pseudo: string; };
}