import {
  ApiHideProperty,
  ApiProperty,
  ApiPropertyOptional,
  ApiSchema,
} from '@nestjs/swagger';

export type Message<T = unknown, K = unknown> = {
  log?: string;
  message: string;
  data: T;
  meta?: K;
};

@ApiSchema({
  description: "Représentation des messages renvoyés de l'API. Peut contenir 'meta', si des données sont necéssaires en plus de 'data'."
})
export class ApiResponseDto<T = unknown, K = unknown> {
  @ApiProperty({
    example: 'Liste des utilisateurs récupérée.',
    description: 'Message de réponse',
  })
  message: string;

  /*
   * Pas de @ApiProperty ici.
   * Le type réel sera défini par ApiMessageResponse().
   */
  @ApiProperty({
    description: "Données ou message d'erreur envoyé avec la réponse de l'API."
  })
  data: T;

  /*
   * Même principe pour meta.
   */
  @ApiHideProperty()
  meta?: K;
}