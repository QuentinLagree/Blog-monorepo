import { ApiSchema, OmitType, PickType } from "@nestjs/swagger";
import { UserEntity } from "../entities/user.entities";

@ApiSchema({
    description: "Informations publiques d’un utilisateur, sans données sensibles comme le mot de passe ou autres données susceptible d'être un danger pour la vie privée de l'utilisateur."
})
export class PublicUserDto extends PickType(UserEntity, [
    "id",
    "pseudo",
    "created_at",
    "role",
] as const) {
}
