import { PasswordService } from 'src/commons/services/argon.service';
import { ConfigService } from '@nestjs/config';

describe('PasswordService', () => {
  const configuration = (pepper: string, production = false) =>
    ({
      get: (name: string) =>
        name === 'ARGON2_PEPPER'
          ? pepper
          : name === 'NODE_ENV' && production
            ? 'production'
            : undefined,
    }) as unknown as ConfigService;

  it('should use the injected pepper rather than an import-time environment snapshot', async () => {
    const first = new PasswordService(configuration('first-secret'));
    const second = new PasswordService(configuration('second-secret'));
    const hash = await first.hashPassword('password12345');
    await expect(first.verifyPassword(hash, 'password12345')).resolves.toBe(
      true,
    );
    await expect(second.verifyPassword(hash, 'password12345')).resolves.toBe(
      false,
    );
  });

  it('should refuse a missing production pepper', () => {
    expect(() => new PasswordService(configuration('', true))).toThrow(
      'ARGON2_PEPPER',
    );
  });
  let passwordService: PasswordService;

  beforeEach(() => {
    passwordService = new PasswordService();
  });

  describe('hashPassword', () => {
    it('should hash password', async () => {
      const password = 'password123';

      const hash = await passwordService.hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(typeof hash).toBe('string');
    });
  });

  describe('verifyPassword', () => {
    it('should return true if password matches hash', async () => {
      const password = 'password123';

      const hash = await passwordService.hashPassword(password);

      const response = await passwordService.verifyPassword(hash, password);

      expect(response).toBe(true);
    });

    it('should return false if password does not match hash', async () => {
      const password = 'password123';
      const wrongPassword = 'wrong-password';

      const hash = await passwordService.hashPassword(password);

      const response = await passwordService.verifyPassword(
        hash,
        wrongPassword,
      );

      expect(response).toBe(false);
    });

    it('should return false if stored hash is invalid', async () => {
      const response = await passwordService.verifyPassword(
        'invalid-hash',
        'password123',
      );

      expect(response).toBe(false);
    });
  });

  describe('needsRehash', () => {
    it('should not require rehashing a hash created with the current options', async () => {
      const password = 'password123';

      const hash = await passwordService.hashPassword(password);

      const response = await passwordService.needsRehash(hash);

      expect(response).toBe(false);
    });
  });

  it('should require rehashing when the configured time cost changes', async () => {
    const previousTime = process.env['ARGON2_TIME'];
    try {
      process.env['ARGON2_TIME'] = '1';
      const hash = await passwordService.hashPassword('password123');
      process.env['ARGON2_TIME'] = '2';
      await expect(passwordService.needsRehash(hash)).resolves.toBe(true);
    } finally {
      if (previousTime === undefined) delete process.env['ARGON2_TIME'];
      else process.env['ARGON2_TIME'] = previousTime;
    }
  });
});
