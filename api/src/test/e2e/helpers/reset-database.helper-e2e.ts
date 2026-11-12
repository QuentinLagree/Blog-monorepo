import { PrismaService } from 'src/commons/prisma/prisma.service';

export async function resetDatabase(prisma: PrismaService) {
  const databaseName = new URL(
    process.env['DATABASE_URL'] ?? '',
  ).pathname.slice(1);
  if (!/(?:^|_)(?:test|e2e)(?:_|$)/i.test(databaseName)) {
    throw new Error(
      'Refus de nettoyer une base qui ne porte pas un nom de test.',
    );
  }
  await prisma.$transaction([
    prisma.verificationTokens.deleteMany(),
    prisma.like.deleteMany(),
    prisma.postRead.deleteMany(),
    prisma.userPreference.deleteMany(),
    prisma.post.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}
