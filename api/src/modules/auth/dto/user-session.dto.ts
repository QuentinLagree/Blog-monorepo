import { ApiProperty } from "@nestjs/swagger"
import { Role } from "src/commons/roles/role.enum"

export class UserSessionDto {
    @ApiProperty({
    type: 'number',
    description: "L'identifiant unique de l'utilisateur.",
    example: 42
  })
    id: number
    @ApiProperty({
        type: 'string',
        description: "l'Email unique de l'utilisateur.",
        example: "johndoe42@gmail.com"
    })
    email: string
    @ApiProperty({
        type: "string",
        description: "Le role de l'utilisateur (user ou admin)",
        example: Role.User
    })
    role: string
}