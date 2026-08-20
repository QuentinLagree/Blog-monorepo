import { ApiSchema, OmitType } from "@nestjs/swagger";
import { UserEntity } from "../entities/user.entities";

@ApiSchema({
    description: "Informations publiques d’un utilisateur, sans données sensibles comme le mot de passe."
})
export class PublicUserDto extends OmitType(UserEntity, ["password", "role", "posts"] as const) {

}