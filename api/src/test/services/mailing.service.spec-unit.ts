import { promises as fs } from 'fs';
import { MailingService } from 'src/commons/mailing/mailing.service';
import { FailSendingMailException } from 'src/commons/mailing/exceptions/fail-sending-mail.exception';

jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
  },
}));

describe('MailingService', () => {
  let mailingService: MailingService;

  const readFileMock = fs.readFile as jest.Mock;

    beforeEach(() => {
    jest.clearAllMocks();

    mailingService = new MailingService();
  });

  describe('getOptionRecoveryEmail', () => {
    it('should return recovery email options', async () => {
      const verificationEmailData = {
        email: 'test@test.com',
        code: '1234567890abcdef1234567890abcdef',
        expired_at: new Date(),
      };

      const url = 'http://localhost:3000/auth/reset?token=abc&email=test@test.com';

      readFileMock.mockResolvedValue(
        '<p>Email: {{email}}</p><p>Url: {{url}}</p>',
      );

      const response = await mailingService.getOptionRecoveryEmail(
        verificationEmailData,
        url,
      );

      expect(response).toEqual({
        to: verificationEmailData.email,
        subject: 'Réinitialiser votre mot de passe.',
        html: `<p>Email: ${verificationEmailData.email}</p><p>Url: http://localhost:3000/auth/reset?token&#x3D;abc&amp;email&#x3D;test@test.com</p>`,
      });
    });

    it('should throw FailSendingMailException if template cannot be read', async () => {
      readFileMock.mockRejectedValue(new Error('File not found'));

      await expect(
        mailingService.getOptionRecoveryEmail(
          {
            email: 'test@test.com',
            code: '1234567890abcdef1234567890abcdef',
            expired_at: new Date(),
          },
          'http://localhost:3000/reset',
        ),
      ).rejects.toThrow(FailSendingMailException);
    });
  });

  describe('getOptionsWelcomeMail', () => {
    it('should return welcome email options', async () => {
      const user = {
        id: 1,
        email: 'test@test.com',
        pseudo: 'testuser',
      } as any;

      readFileMock.mockResolvedValue(
        '<p>Username: {{username}}</p><p>Email: {{email}}</p>',
      );

      const response = await mailingService.getOptionsWelcomeMail(user);

      expect(response).toEqual({
        to: user.email,
        subject: 'Bienvenue !',
        html: `<p>Username: ${user.pseudo}</p><p>Email: ${user.email}</p>`,
      });
    });

    it('should throw FailSendingMailException if welcome template cannot be read', async () => {
      readFileMock.mockRejectedValue(new Error('File not found'));

      await expect(
        mailingService.getOptionsWelcomeMail({
          id: 1,
          email: 'test@test.com',
          pseudo: 'testuser',
        } as any),
      ).rejects.toThrow(FailSendingMailException);
    });
  });
});