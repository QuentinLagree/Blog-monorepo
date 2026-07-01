import { PasswordService } from 'src/commons/services/argon.service';

describe('PasswordService', () => {
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

      const response = await passwordService.verifyPassword(hash, wrongPassword);

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
    it('should return a boolean', async () => {
      const password = 'password123';

      const hash = await passwordService.hashPassword(password);

      const response = await passwordService.needsRehash(hash);

      expect(typeof response).toBe('boolean');
    });
  });
});