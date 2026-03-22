// mailing.controller.ts
import { Controller, Get } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { MailingService } from './mailing.service';
import { MAIL_QUEUE } from 'src/commons/mailing/bullmq/bullmq.token';
import { Queue } from 'bullmq';
import { Message } from '../types/dto/message/message';
import { makeMessage } from '../helpers/logger.helper';

@Controller('mailing')
export class MailingController {
    constructor(
        private readonly mailing: MailingService,
        @Inject(MAIL_QUEUE) private readonly mailQueue: Queue,
    ) { }

    @Get('')
    async send_mail(): Promise<Message<null>> {
        const data = await this.mailing.getOptionsWelcomeMail({
            id: 1,
            email: 'lagreequentindev21@gmail.com',
            pseudo: 'QuentinLA',
            nom: 'Lagree',
            prenom: 'Quentin',
            password: 'XXXX',
            role: 'admin',
            created_at: new Date(),
            updated_at: new Date(),
        } as any); // adapte le type selon ton User

        await this.mailQueue.add('welcome-email', data, {
            delay: 10_000, // 10 secondes avant exécution
            attempts: 3,   // réessaie 3 fois si erreur
            backoff: { type: 'exponential', delay: 2000 },
        }); // <-- data concret, pas une Promise
        return makeMessage('queued', '', null);
    }
}
