import { VerificationTokens } from '@prisma/client';
import { TOKEN } from 'src/commons/types/token.types';

export const MockToken: string = '309d1b0fa48d40e376c9dd9455957ee0';
export const OtherToken: string = '309d1b0fa48d40e376c9d79455957ee0';

export const createVerificationEmailMock = (
  overrides: Partial<VerificationTokens> = {},
) => ({
  id: 1,
  email: 'johndoe@gmail.com',
  code: MockToken,
  expired_at: new Date(Date.now() + TOKEN.EXPIRED_TOKEN),
  created_at: new Date(),
  ...overrides,
});

export const createOtherVerificationEmailMock = (
  overrides: Partial<VerificationTokens> = {},
) => ({
  id: 1,
  email: 'johndoe21@gmail.com',
  code: OtherToken,
  expired_at: new Date(Date.now() + TOKEN.EXPIRED_TOKEN),
  created_at: new Date(),
  ...overrides,
});

export const createVerificatioEmailParamSetTokenMock = (
  overrides: Partial<VerificationTokens> = {},
) => ({
  email: 'johndoe@gmail.com',
  code: MockToken,
  expired_at: new Date(Date.now() + TOKEN.EXPIRED_TOKEN),
  ...overrides,
});
