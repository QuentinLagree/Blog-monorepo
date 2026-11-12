import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/commons/prisma/prisma.service';
import { PasswordService } from 'src/commons/services/argon.service';
import { TOKEN } from 'src/commons/types/token.types';
import { TokenExpiredOrInvalidException } from './exceptions/token-expired-or-invalid.exception';

@Injectable()
export class PasswordRecoveryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
  ) {}

  async reset(email: string, token: TOKEN, password: string): Promise<void> {
    const hash = await this.passwords.hashPassword(password);
    await this.prisma.$transaction(async (tx) => {
      const [user] = await tx.$queryRaw<
        { id: number }[]
      >`SELECT id FROM user WHERE email = ${email} FOR UPDATE`;
      if (!user) throw new TokenExpiredOrInvalidException();
      // The conditional DELETE locks the matching row. A concurrent consumer
      // waits, then observes count=0 after the winner commits.
      const consumed = await tx.verificationTokens.deleteMany({
        where: {
          userId: user.id,
          email,
          code: token.getToken,
          expired_at: { gte: new Date() },
        },
      });
      if (consumed.count !== 1) throw new TokenExpiredOrInvalidException();
      await tx.user.update({
        where: { id: user.id },
        data: { password: hash },
      });
    });
  }
}
