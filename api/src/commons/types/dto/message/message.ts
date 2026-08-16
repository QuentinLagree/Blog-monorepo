import {
  ApiProperty,
} from '@nestjs/swagger';

export type Message<T = unknown, K = unknown> = {
  log?: string;
  message: string;
  data: T;
  meta?: K;
};

export class MessageDto<T = unknown, K = unknown> {
  @ApiProperty({
    example: 'Liste des utilisateurs récupérée.',
    description: 'Message de réponse',
  })
  message: string;

  /*
   * Pas de @ApiProperty ici.
   * Le type réel sera défini par ApiMessageResponse().
   */
  data: T;

  /*
   * Même principe pour meta.
   */
  meta?: K;
}