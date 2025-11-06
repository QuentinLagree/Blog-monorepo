export type PrismaUserServiceMockType = {
  user: PrismaUserServiceMethodsMockType;
  verificationTokens: PrismaVerificationEmailServiceMethodsMockType;
  post: PrismaPostServiceMethodsMockType;
};

type PrismaUserServiceMethodsMockType = {
  findMany: jest.Mock;
  findFirst: jest.Mock;
  findUnique: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
};

type PrismaPostServiceMethodsMockType = {
  findMany: jest.Mock;
  findUnique: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
};

type PrismaVerificationEmailServiceMethodsMockType = {
  findFirst: jest.Mock;
  create: jest.Mock;
  count: jest.Mock;
  delete: jest.Mock;
  findUnique: jest.Mock;
};

export const CreatePrismaServiceMock = (): PrismaUserServiceMockType => {
  return {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    verificationTokens: {
      create: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      delete: jest.fn(),
      findUnique: jest.fn(),
    },
    post: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
};
