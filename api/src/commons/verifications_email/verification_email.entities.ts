import { ApiProperty } from '@nestjs/swagger';
import { VerificationTokens } from '@prisma/client';

export class VerificationEmailEntity implements VerificationTokens {
  @ApiProperty()
  id: number;

  @ApiProperty()
  email: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  expired_at: Date;

  @ApiProperty()
  created_at: Date;

  constructor(partial: Partial<VerificationEmailEntity>) {
    Object.assign(this, partial);
  }
}
