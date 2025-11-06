import { MailerService } from '@nestjs-modules/mailer';
import { MailService } from '../../src/config/mail/mailer.service';
import { Test, TestingModule } from '@nestjs/testing';
import {
  CreatePackageMailerService,
  MailerPackageServiceMockType,
} from '../mocks/services/auth/create_mailer_package.service.mocks';
import * as HtmlReader from 'src/commons/helpers/HTML_reader';

describe('MailService', () => {
  let service: MailService;
  let _mailer: MailerPackageServiceMockType;

  beforeEach(async () => {
    _mailer = CreatePackageMailerService();

    const app: TestingModule = await Test.createTestingModule({
      providers: [MailService, { provide: MailerService, useValue: _mailer }],
    }).compile();

    service = app.get<MailService>(MailService);
  });

  describe('MailService - providers are defined', () => {
    it('MailService should be defined', () => {
      expect(service).toBeDefined();
    });

    it('MailerService package should be defined', () => {
      expect(_mailer).toBeDefined();
    });
  });

  describe('MailService - sendEmailToken()', () => {
    let readHTMLFile: jest.SpyInstance;
    let sendMailMock: jest.Mock;
    const verificationEmailData = {
      email: 'test@mail.com',
      code: 'token',
      expired_at: new Date(),
    };
    const url = 'http://reset.url';

    beforeEach(() => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      readHTMLFile = jest.spyOn(HtmlReader, 'readHTMLFile');
      sendMailMock = _mailer.sendMail;
      readHTMLFile.mockReset();
      sendMailMock.mockReset();
    });
    afterAll(() => {
      jest.restoreAllMocks();
    });

    it('should send an email when everything is OK', async () => {
      readHTMLFile.mockImplementation((_, cb) => {
        cb(null, '<div>{{email}} {{url}}</div>');
      });
      sendMailMock.mockResolvedValue(undefined);

      await expect(
        service.sendEmailToken(verificationEmailData, url as any),
      ).resolves.toBeUndefined();
      expect(readHTMLFile).toHaveBeenCalled();
      expect(sendMailMock).toHaveBeenCalledWith(
        expect.objectContaining({
          to: verificationEmailData.email,
          html: expect.stringContaining(verificationEmailData.email),
        }),
      );
    });

    it('should throw FailSendingMail if HTML file reading fails', async () => {
      readHTMLFile.mockImplementation((_, cb) => {
        cb(new Error('fail'), '');
      });
      await expect(
        service.sendEmailToken(verificationEmailData, url as any),
      ).rejects.toThrow();
      expect(readHTMLFile).toHaveBeenCalled();
      expect(sendMailMock).not.toHaveBeenCalled();
    });

    it('should throw FailSendingMail if template compilation fails', async () => {
      readHTMLFile.mockImplementation((_, cb) => {
        cb(null, null as any); // content is null, Handlebars.compile will throw
      });
      await expect(
        service.sendEmailToken(verificationEmailData, url as any),
      ).rejects.toThrow();
      expect(sendMailMock).not.toHaveBeenCalled();
    });

    it('should throw FailSendingMail if sendMail fails (async)', async () => {
      readHTMLFile.mockImplementation((_, cb) => {
        cb(null, '<div>{{email}}</div>');
      });
      sendMailMock.mockRejectedValue(new Error('smtp fail'));
      await expect(
        service.sendEmailToken(verificationEmailData, url as any),
      ).rejects.toThrow();
      expect(sendMailMock).toHaveBeenCalled();
    });
  });
});
