import { PickType } from '@nestjs/swagger';
import { UserEntity } from '../../user/entities/user.entities';

export class MyProfileDto extends PickType(UserEntity, [
  'id',
  'nom',
  'prenom',
  'pseudo',
  'email',
  'role',
  'created_at',
  'updated_at',
] as const) {}
