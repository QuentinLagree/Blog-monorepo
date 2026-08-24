import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateUserPreferenceDto {
  @ApiPropertyOptional({
    description: "Thème de couleurs",
    enum: ['light', 'dark', 'system', 'cream'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['light', 'dark', 'system', 'cream'])
  theme?: string;

  @ApiPropertyOptional({
    description: "Langues utilisée",
    enum: ['fr', 'en'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['fr', 'en'])
  language?: string;

  @ApiPropertyOptional({
    description: "Taille de la police d'écriture",
    enum: ['small', 'medium', 'large'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['small', 'medium', 'large'])
  fontSize?: string;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({
    description: "Réduire les animations",
    type: "boolean",
    example: true
  })
  reduceAnimations?: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({
    description: "Afficher les temps de lecture d'un article",
    type: "boolean",
    example: true
  })

  showReadingTime?: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({
    description: "Afficher les informations de l'auteurs lors de la lecture d'un article",
    type: "boolean",
    example: true
  })
  showAuthorDetails?: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({
    description: "Masquer les articles déjà lu",
    type: "boolean",
    example: true
  })
  hideReadPosts?: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({
    description: "Notifier lors d'un like sur un de nos article",
    type: "boolean",
    example: true
  })
  notifyOnLike?: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({
    description: "Notifier lors qu'un utilisateur effectue une collaboration avec moi (à venir)",
    type: "boolean",
    example: true
  })
  notifyOnContribution?: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({
    description: "Notifier l'utilisateur par email également",
    type: "boolean",
    example: true
  })
  emailNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({
    description: "Recevoir des email de la newsletter",
    type: "boolean",
    example: true
  })
  newsletter?: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({
    description: "Masquer le profil utilisateur aux autres utilisateurs",
    type: "boolean",
    example: true
  })
  profileVisible?: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({
    description: "Afficher les articles likés.",
    type: "boolean",
    example: true
  })
  showLikedPosts?: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({
    description: "Afficher les contributions sur la page du profil utilisateur",
    type: "boolean",
    example: true
  })
  showContributions?: boolean;
}