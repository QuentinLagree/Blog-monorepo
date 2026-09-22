import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MessageValidationError {
    @ApiProperty({
        type: "string",
      description: 'Nom de l\'a propriété qui fais défaut à la vérification.',
      example: "email",
    })
    property: string;

    @ApiPropertyOptional({
        type: "object",
      description: "Objet permettant de connaître l'erreur précise.",
      additionalProperties: {
        type: "string"
      },
      example: {
        isString: "La propriété doit être une chaîne de caractère."
      }
    })
    constraints?: Record<string, string>;
}