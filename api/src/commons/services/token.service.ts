import { Injectable } from '@nestjs/common';
import { Prisma, VerificationTokens } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { TOKEN } from 'src/commons/types/token.types';
import { VerificationEmailDto } from 'src/modules/handle-password/verifications_email/dto/verification_email.dto';
import { PrismaService } from '../prisma/prisma.service';
import { ResetTokenAlreadyActiveException } from 'src/modules/handle-password/exceptions/reset-token-already-active.exception';
import { TokenExpiredOrInvalidException } from 'src/modules/handle-password/exceptions/token-expired-or-invalid.exception';
import { UserNotFoundException } from 'src/modules/user/exceptions/user-not-found.exception';

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
    for (let attempt = 0; ; attempt++) {
      try {
        return await this._prisma.$transaction(async (tx) => {
          // Serialize issuance with account updates and deletion before touching tokens.
          const [user] = await tx.$queryRaw<
            { id: number }[]
          >`SELECT id FROM user WHERE email = ${tokenDto.email} FOR UPDATE`;
          if (!user) throw new UserNotFoundException(tokenDto.email);
          // Never delete a new active token created by a competing request.
          await tx.verificationTokens.deleteMany({
            where: { userId: user.id, expired_at: { lt: new Date() } },
          });
          return tx.verificationTokens.create({
            data: { ...tokenDto, userId: user.id },
          });
        });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === 'P2002')
            throw new ResetTokenAlreadyActiveException();
          if (error.code === 'P2034' && attempt < 2) continue;
        }
        throw error;
      }
    }
  }

  async delete(email: string): Promise<void> {
    await this._prisma.verificationTokens.deleteMany({
      where: { email },
    });
  }

  async deleteMatching(email: string, code: TOKEN): Promise<void> {
    await this._prisma.verificationTokens.deleteMany({
      where: { email, code: code.getToken },
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
        user: { email },
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
