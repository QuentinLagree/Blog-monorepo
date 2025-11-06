import { ApiProperty } from '@nestjs/swagger';
import { Post, User } from '@prisma/client';
import { Exclude } from 'class-transformer';

export class UserEntity implements User {
  @ApiProperty()
  id: number;

  @ApiProperty()
  nom: string;
  @ApiProperty()
  prenom: string;
  @ApiProperty()
  pseudo: string;
  @ApiProperty()
  email: string;

  @Exclude({
    toPlainOnly: true,
  })
  @ApiProperty()
  password: string;

  @Exclude({
    toPlainOnly: true,
  })
  @ApiProperty()
  role: string;

  @ApiProperty()
  created_at: Date;
  @ApiProperty()
  updated_at: Date;

  @ApiProperty()
  posts?: Post[];

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }
}
