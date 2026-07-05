import { PrismaService } from 'src/commons/prisma/prisma.service';

export async function resetDatabase(prisma: PrismaService) {
  await prisma.verificationTokens.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();
}