import { Injectable } from '@nestjs/common';
import { VerificationEmailDto } from 'src/commons/verifications_email/verification_email.dto';
import { readHTMLFile } from 'src/commons/helpers/HTML_reader';
import { MailerService } from '@nestjs-modules/mailer';
import { FailSendingMail } from 'src/commons/exceptions/failSendingMail.error';
import Handlebars from 'handlebars';

@Injectable()
export class MailService {
  constructor(private readonly _mailer: MailerService) {}

  async sendEmailToken(
    verificationEmailData: VerificationEmailDto,
    url: string,
  ): Promise<void> {
    try {
      const content: string = await new Promise((resolve, reject) => {
        readHTMLFile(
          __dirname +
            '../../../../src/templates/mails/password_token_mail.html',
          (error: Error, content: string) => {
            if (error) {
              return reject(error);
            }
            resolve(content);
          },
        );
      });
      try {
        const template = Handlebars.compile(content);
        const replacements = {
          email: verificationEmailData.email,
          url: url,
        };
        const htmlToSend = template(replacements);
        const mailOptions = {
          from: 'lagreequentindev21@gmail.com',
          to: verificationEmailData.email,
          subject: 'Réinitialiser votre mot de passe.',
          html: htmlToSend,
        };
        await this._mailer.sendMail(mailOptions);
      } catch (err) {
        console.error('error building or sending mail', err);
        throw new FailSendingMail();
      }
    } catch (error) {
      console.error('error reading file', error);
      throw new FailSendingMail();
    }
  }
}
