import { OmitType, PartialType } from "@nestjs/swagger";
import { Articles } from "./posts.dto";

export class PostSummaryDto extends
    OmitType(
        Articles,
        ['content', 'created_at', 'author', 'like'] as const,
    ) {
    author?: {
        id: number;
        pseudo: string;
    };

    like?: {
        count: number;
    };
}