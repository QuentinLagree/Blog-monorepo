import { BadRequestException, Injectable } from '@nestjs/common';
import { VerificationTokens } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { VerificationEmailDto } from 'src/commons/verifications_email/verification_email.dto';
import { TOKEN } from 'src/commons/types/token.types';
import { TokenExpiredOrInvalidException } from 'src/commons/exceptions/TokenIsExpired.error';
import { PrismaService } from '../prisma/prisma.service';

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
    try {
      const verifEmail = await this._prisma.verificationTokens.findFirst({
        where: { email: tokenDto.email },
      });
      if (verifEmail !== null) {
        if (this.tokenIsExpired(verifEmail)) {
          await this.delete(tokenDto.email);
        }
      }
      return await this._prisma.verificationTokens.create({ data: tokenDto });
    } catch (error) {
      throw new BadRequestException();
    }
  }

  async delete(email: string): Promise<void> {
    try {
      await this._prisma.verificationTokens.delete({
        where: { email },
      });
      return;
    } catch (error) {
      throw error;
    }
  }

  async assertVerificationTokenIsValid(
    email: string,
    code: TOKEN,
  ): Promise<void> {
    const verifEmail = await this._prisma.verificationTokens.findUnique({
      where: { email, code: code.getToken },
    });

    if (!verifEmail || this.tokenIsExpired(verifEmail)) {
      throw new TokenExpiredOrInvalidException();
    }
  }

  private tokenIsExpired(verifEmail: VerificationTokens): boolean {
    return verifEmail.expired_at.getTime() < new Date(Date.now()).getTime();
  }
}
