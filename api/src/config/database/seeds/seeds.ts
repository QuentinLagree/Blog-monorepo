import { PrismaClient } from '@prisma/client';
import { PasswordService } from 'src/commons/services/argon.service';
import { usersSeedData } from './data/users.seed';
import { postsSeedData } from './data/posts.seed';

const prisma = new PrismaClient();
const passwordService = new PasswordService();

async function seedUsers(): Promise<void> {
  console.log('Création des utilisateurs...');

  for (const userData of usersSeedData) {
    const hashedPassword = await passwordService.hashPassword(
      userData.password,
    );

    await prisma.user.upsert({
      where: {
        email: userData.email,
      },
      update: {
        nom: userData.nom,
        prenom: userData.prenom,
        pseudo: userData.pseudo,
        role: userData.role ?? 'user',
      },
      create: {
        nom: userData.nom,
        prenom: userData.prenom,
        email: userData.email,
        pseudo: userData.pseudo,
        password: hashedPassword,
        role: userData.role ?? 'user',

      },
    });
  }

  console.log(`${usersSeedData.length} utilisateurs créés.`);
}

async function seedPosts(): Promise<void> {
  console.log('Création des posts...');

  const users = await prisma.user.findMany({
    select: {
      id: true,
    },
    orderBy: {
      id: 'asc',
    },
  });

  if (users.length === 0) {
    throw new Error(
      'Impossible de créer les posts : aucun utilisateur disponible.',
    );
  }

  const posts = postsSeedData.map((post, index) => {
    const author = users[index % users.length];

    return {
      authorId: author.id,
      title: post.title,
      description: post.description,
      content: post.content,
      published_at: post.published_at,
    };
  });

  await prisma.post.createMany({
    data: posts,
  });

  console.log(`${posts.length} posts créés.`);
}

async function clearDatabase(): Promise<void> {
  console.log('Nettoyage de la base de données...');

  /*
   * Les posts doivent être supprimés avant les utilisateurs
   * à cause de la clé étrangère authorId.
   */
  await prisma.like.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();

  console.log('Base de données nettoyée.');
}

async function main(): Promise<void> {
  await clearDatabase();

  await seedUsers();
  await seedPosts();

  console.log('Seed terminée avec succès.');
}

main()
  .catch((error: unknown) => {
    console.error('Erreur pendant la seed :', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });