import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';
import Handlebars from 'handlebars';
import { VerificationEmailDto } from '../verifications_email/dto/verification_email.dto';
import { User } from '@prisma/client';
import { FailSendingMailException } from './exceptions/fail-sending-mail.exception';

@Injectable()
export class MailingService {
  // En prod (build): __dirname ~ dist/commons/mailing
  private readonly distTemplatesDir = join(
    __dirname,
    'mail',
    'templates',
  );
  // En dev (ts-node): on lit depuis src/commons/mailing/mail/templates
  private readonly srcTemplatesDir = join(
    process.cwd(),
    'src',
    'commons',
    'mailing',
    'mail',
    'templates',
  );


  private resolveTemplatePath(...segments: string[]) {
    const distPath = join(__dirname, '../../templates', ...segments);
    return distPath;
  }


  private async loadTemplate(relPath: string): Promise<string> {
    try {
      return await fs.readFile(join(this.distTemplatesDir, relPath), 'utf8');
    } catch {
      return await fs.readFile(join(this.srcTemplatesDir, relPath), 'utf8');
    }
  }

  private render(tpl: string, ctx: Record<string, unknown>) {
    return Handlebars.compile(tpl)(ctx);
  }

  async getOptionRecoveryEmail(
    verificationEmailData: VerificationEmailDto,
    url: string,
  ) {
    try {
      const content = await this.loadTemplate('password_token_mail.html');
      const html = this.render(content, {
        email: verificationEmailData.email,
        url,
      });
      return { to: verificationEmailData.email, subject: 'Réinitialiser votre mot de passe.', html };
    } catch (e) {
      throw new FailSendingMailException();
    }
  }

  async getOptionsWelcomeMail(user: User) {
    try {
      const content = await this.loadTemplate('welcome_mail.html');
      const html = this.render(content, { username: user.pseudo, email: user.email });
      return { to: user.email, subject: 'Bienvenue !', html };
    } catch (e) {
      throw new FailSendingMailException();
    }
  }
}
