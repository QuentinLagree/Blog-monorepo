import { ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import { Articles } from './posts.dto';

export class PostSummaryDto extends OmitType(
    Articles,
    ['content', 'created_at', 'author', 'like'] as const,
) {
    @ApiPropertyOptional({
        description: "Informations sur l'auteur de l'article.",
        type: 'object',
        properties: {
            id: {
                type: 'integer',
                example: 1,
                description: "Identifiant de l'auteur.",
            },
            pseudo: {
                type: 'string',
                example: 'Quentin',
                description: "Pseudonyme de l'auteur.",
            },
        },
    })
    author?: {
        id: number;
        pseudo: string;
    };

    @ApiPropertyOptional({
        description: "Informations sur les mentions J'aime de l'article.",
        type: 'object',
        properties: {
            count: {
                type: 'integer',
                minimum: 0,
                example: 12,
                description: "Nombre de mentions J'aime de l'article.",
            },
        },
    })
    like?: {
        count: number;
    };
}