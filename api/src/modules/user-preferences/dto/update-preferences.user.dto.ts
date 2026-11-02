import { ApiPropertyOptional } from '@nestjs/swagger';

import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateUserPreferenceDto {
  @ApiPropertyOptional({
    description: 'Thème de couleurs',
    enum: ['light', 'dark', 'system', 'cream'],
  })
  @IsOptional()
  @IsString({
    message: 'Le thème doit être une chaîne de caractère.',
  })
  @IsIn(['light', 'dark', 'system', 'cream'], {
    message: 'Le thème doit être parmi les valeurs suivantes : $constraint1',
  })
  theme?: string;

  @ApiPropertyOptional({
    description: 'Langues utilisée',
    enum: ['fr', 'en'],
  })
  @IsOptional()
  @IsString({
    message: 'Le language doit être une chaîne de caractère.',
  })
  @IsIn(['fr', 'en'], {
    message: 'La langue doit être parmi les valeurs suivantes : $constraint1',
  })
  language?: string;

  @ApiPropertyOptional({
    description: "Taille de la police d'écriture",
    enum: ['small', 'medium', 'large'],
  })
  @IsOptional()
  @IsString({
    message:
      "La taille de la police d'écriture doit être une chaîne de caractère.",
  })
  @IsIn(['small', 'medium', 'large'], {
    message:
      "La taille de la police d'écriture doit être parmi les valeurs suivantes : $constraint1",
  })
  fontSize?: string;

  @IsOptional()
  @IsBoolean({
    message:
      'La réduction des animations doit être un booléen (true ou false).',
  })
  @ApiPropertyOptional({
    description: 'Réduire les animations',
    type: 'boolean',
    example: true,
  })
  reduceAnimations?: boolean;

  @IsOptional()
  @IsBoolean({
    message:
      "L'affichage du temps de lecture d'un article doit être un booléen (true ou false).",
  })
  @ApiPropertyOptional({
    description: "Afficher les temps de lecture d'un article",
    type: 'boolean',
    example: true,
  })
  showReadingTime?: boolean;

  @IsOptional()
  @IsBoolean({
    message:
      "L'affichage des informations de l'auteur doit être un booléen (true ou false).",
  })
  @ApiPropertyOptional({
    description:
      "Afficher les informations de l'auteurs lors de la lecture d'un article",
    type: 'boolean',
    example: true,
  })
  showAuthorDetails?: boolean;

  @IsOptional()
  @IsBoolean({
    message:
      'Le masquage des articles déjà lus doit être un booléen (true ou false).',
  })
  @ApiPropertyOptional({
    description: 'Masquer les articles déjà lu',
    type: 'boolean',
    example: true,
  })
  hideReadPosts?: boolean;

  @IsOptional()
  @IsBoolean({
    message:
      'La notification lors d’un like doit être un booléen (true ou false).',
  })
  @ApiPropertyOptional({
    description: 'Notifier lors d’un like sur un de nos article',
    type: 'boolean',
    example: true,
  })
  notifyOnLike?: boolean;

  @IsOptional()
  @IsBoolean({
    message:
      'La notification lors d’une contribution doit être un booléen (true ou false).',
  })
  @ApiPropertyOptional({
    description:
      "Notifier lors qu'un utilisateur effectue une collaboration avec moi (à venir)",
    type: 'boolean',
    example: true,
  })
  notifyOnContribution?: boolean;

  @IsOptional()
  @IsBoolean({
    message:
      'Les notifications par email doivent être un booléen (true ou false).',
  })
  @ApiPropertyOptional({
    description: "Notifier l'utilisateur par email également",
    type: 'boolean',
    example: true,
  })
  emailNotifications?: boolean;

  @IsOptional()
  @IsBoolean({
    message:
      "L'abonnement à la newsletter doit être un booléen (true ou false).",
  })
  @ApiPropertyOptional({
    description: 'Recevoir des email de la newsletter',
    type: 'boolean',
    example: true,
  })
  newsletter?: boolean;

  @IsOptional()
  @IsBoolean({
    message:
      'La visibilité du profil doit être un booléen (true ou false).',
  })
  @ApiPropertyOptional({
    description: 'Masquer le profil utilisateur aux autres utilisateurs',
    type: 'boolean',
    example: true,
  })
  profileVisible?: boolean;

  @IsOptional()
  @IsBoolean({
    message:
      "L'affichage des articles likés doit être un booléen (true ou false).",
  })
  @ApiPropertyOptional({
    description: 'Afficher les articles likés.',
    type: 'boolean',
    example: true,
  })
  showLikedPosts?: boolean;

  @IsOptional()
  @IsBoolean({
    message:
      "L'affichage des contributions doit être un booléen (true ou false).",
  })
  @ApiPropertyOptional({
    description:
      'Afficher les contributions sur la page du profil utilisateur',
    type: 'boolean',
    example: true,
  })
  showContributions?: boolean;
}