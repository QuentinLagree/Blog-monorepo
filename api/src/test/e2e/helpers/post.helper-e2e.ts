import { PrismaService } from 'src/commons/prisma/prisma.service';

type CreateTestPostOptions = Partial<{
  title: string;
  content: string;
  description: string;
  published_at: Date | null;
}>;

export async function createTestPost(
  prisma: PrismaService,
  userId: number,
  options: CreateTestPostOptions = {},
) {
  const unique = Date.now() + Math.floor(Math.random() * 10000);

  return prisma.post.create({
    data: {
      title: options.title ?? `Post ${unique}`,
      content: options.content ?? `Content ${unique}`,
      description: options.description ?? `Description ${unique}`,
      published_at: options.published_at !== undefined ? options.published_at : new Date(),
      authorId: userId,
    },
  });
}