import * as request from 'supertest';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { PrismaService } from 'src/commons/prisma/prisma.service';
import { PasswordService } from 'src/commons/services/argon.service';
import { Role } from 'src/commons/roles/role.enum';
import { createTestUser } from './create_user-helper-e2e';

type CreateLoggedAgentOptions = Partial<{
  email: string;
  pseudo: string;
  nom: string;
  prenom: string;
  password: string;
  role: Role;
}>;

export async function createLoggedAgent(
  app: NestFastifyApplication,
  prisma: PrismaService,
  passwordService: PasswordService,
  options: CreateLoggedAgentOptions = {},
) {
  const password = options.password ?? 'password123';

  const user = await createTestUser(prisma, passwordService, {
    ...options,
    password,
    role: options.role ?? Role.User,
  });

  const agent = request.agent(app.getHttpServer());

  const loginResponse = await agent
    .post('/auth/login')
    .send({
      email: user.email,
      password,
    })
    .expect(201);

  return {
    agent,
    user,
    password,
    cookies: loginResponse.headers['set-cookie'],
  };
}

export async function createLoggedAdminAgent(
  app: NestFastifyApplication,
  prisma: PrismaService,
  passwordService: PasswordService,
) {
  return createLoggedAgent(app, prisma, passwordService, {
    role: Role.Admin,
    email: `admin-${Date.now()}@test.com`,
    pseudo: `admin-${Date.now()}`,
  });
}