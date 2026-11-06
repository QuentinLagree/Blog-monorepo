import { TOKEN } from 'src/commons/types/token.types';
import { TokenInvalidFormat } from 'src/modules/handle-password/exceptions/token-invalid-format.exception';

describe('TOKEN', () => {
  const VALID_TOKEN = '1234567890abcdef1234567890abcdef';

  describe('add', () => {
    it('should create TOKEN instance if token is hexadecimal with 32 characters', () => {
      const token = TOKEN.add(VALID_TOKEN);

      expect(token).toBeInstanceOf(TOKEN);
      expect(token.getToken).toBe(VALID_TOKEN);
    });

    it('should throw error if token is not hexadecimal', () => {
      expect(() => TOKEN.add('invalid-token')).toThrow(
        TokenInvalidFormat
      );
    });

    it('should throw error if token is too short', () => {
      expect(() => TOKEN.add('123abc')).toThrow(
        TokenInvalidFormat
      );
    });
  });

  describe('hasValid', () => {
    it('should return true for valid token', () => {
      expect(TOKEN.hasValid(VALID_TOKEN)).toBe(true);
    });

    it('should return false for invalid token', () => {
      expect(TOKEN.hasValid('invalid-token')).toBe(false);
    });
  });
});