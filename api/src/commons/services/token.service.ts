import { Injectable } from '@nestjs/common';
import { VerificationTokens } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { TOKEN } from 'src/commons/types/token.types';
import { VerificationEmailDto } from 'src/commons/verifications_email/dto/verification_email.dto';
import { PrismaService } from '../prisma/prisma.service';
import { ResetTokenAlreadyActiveException } from 'src/modules/handle-password/exceptions/reset-token-already-active.exception';
import { TokenExpiredOrInvalidException } from 'src/modules/handle-password/exceptions/token-expired-or-invalid.exception';

@Injectable()
export class TokenService {
  constructor(private readonly _prisma: PrismaService) {}

  async generate(): Promise<string> {
    let randomToken: string;
    let tokenExists: number;

    do {
      randomToken = randomBytes(16).toString('hex');
      tokenExists = await this._prisma.verificationTokens.count({
        where: { code: randomToken },
      });
    } while (tokenExists !== 0);

    return randomToken;
  }

  async set(tokenDto: VerificationEmailDto): Promise<VerificationTokens> {
    const existingToken = await this._prisma.verificationTokens.findFirst({
      where: { email: tokenDto.email },
    });

    if (existingToken) {
      if (!this.tokenIsExpired(existingToken)) {
        throw new ResetTokenAlreadyActiveException();
      }

      await this.delete(tokenDto.email);
    }

    return this._prisma.verificationTokens.create({
      data: tokenDto,
    });
  }

  async delete(email: string): Promise<void> {
    await this._prisma.verificationTokens.deleteMany({
      where: { email },
    });
  }

  async assertVerificationTokenIsValid(
    email: string,
    code: TOKEN,
  ): Promise<void> {
    const verificationToken = await this._prisma.verificationTokens.findFirst({
      where: {
        email,
        code: code.getToken,
      },
    });

    if (!verificationToken || this.tokenIsExpired(verificationToken)) {
      throw new TokenExpiredOrInvalidException();
    }
  }

  private tokenIsExpired(verificationToken: VerificationTokens): boolean {
    return verificationToken.expired_at.getTime() < Date.now();
  }
}