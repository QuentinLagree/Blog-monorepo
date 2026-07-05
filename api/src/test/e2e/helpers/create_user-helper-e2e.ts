import { PrismaService } from 'src/commons/prisma/prisma.service';
import { PasswordService } from 'src/commons/services/argon.service';
import { Role } from 'src/commons/roles/role.enum';

type CreateTestUserOptions = Partial<{
  email: string;
  pseudo: string;
  nom: string;
  prenom: string;
  password: string;
  role: Role;
}>;

export async function createTestUser(
  prisma: PrismaService,
  passwordService: PasswordService,
  options: CreateTestUserOptions = {},
) {
  const unique = Date.now() + Math.floor(Math.random() * 10000);
  const password = options.password ?? 'password123';

  return prisma.user.create({
    data: {
      email: options.email ?? `user-${unique}@test.com`,
      pseudo: options.pseudo ?? `user-${unique}`,
      nom: options.nom ?? 'Doe',
      prenom: options.prenom ?? 'John',
      role: options.role ?? Role.User,
      password: await passwordService.hashPassword(password),
    },
  });
}