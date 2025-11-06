import { PrismaClient } from '@prisma/client';

import { PasswordService } from '../../../commons/services/password.service'

import { genSaltSync, hashSync } from 'bcryptjs';

const prisma = new PrismaClient();

const _password = new PasswordService()


async function main() {
  const password = process.env['PASSWORD_SEED'] ?? 'Salut1234!';

  const quentin = await prisma.user.create({
    data: {
      nom: 'Lagree',
      prenom: 'Quentin',
      email: 'lagreequentindev21@gmail.com',
      pseudo: 'QuentinLa',
      password: await _password.hashPassword(password),
      role: 'admin',
      Account: {
        create: {
          followees_count: 0,
          followers_count: 0,
          language: 'fr',
          theme: 'dark',
        },
      },
    },
  });

  const john = await prisma.user.create({
    data: {
      nom: 'John',
      prenom: 'Doe',
      email: 'johndoe@gmail.com',
      pseudo: 'JohnDoe',
      password: await _password.hashPassword("Salut1234!"),
      role: 'user',
      Account: {
        create: {
          followees_count: 0,
          followers_count: 0,
        },
      },
    },
  });

  await prisma.post.createMany({
    data: [
      {
        authorId: quentin.id,
        title: 'Salut je suis un titre très sympathique',
        content: 'Salut je suis un contenue',
        description: 'Ceci est une description du post'
      },
      {
        authorId: quentin.id,
        title:
          'Salut je suis un deuxième titre super sympa aussi voir meilleur !',
        content: 'Encore du contenue, toujours du contenue',
        description: "Ceci est la description de la deuxième publication."
      },
    ],
  });

  await prisma.follows.create({
    data: {
      followee_id: john.id,
      follower_id: quentin.id,
    },
  });
}

main()
  .then(() => {
    console.log('✅ Base seedée avec succès');
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
