// src/commons/mailing/bullmq/bullmq.service.ts
import {
  Inject,
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { Queue, Worker, Job } from 'bullmq';
import type Redis from 'ioredis';
import { REDIS } from 'src/commons/redis/redis.token';
import { MAIL_QUEUE } from './bullmq.token';
import { MailerService } from '@nestjs-modules/mailer';
import { PrismaService } from 'src/commons/prisma/prisma.service';

@Injectable()
export class BullMQService implements OnModuleInit, OnModuleDestroy {
  private worker?: Worker;
  private readonly cleanups = new Set<Promise<unknown>>();

  constructor(
    @Inject(REDIS) private readonly redis: Redis,
    @Inject(MAIL_QUEUE) private readonly mailQueue: Queue,
    private readonly mailer: MailerService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    this.worker = new Worker(
      'mail', // nom de la queue
      async (job: Job<{ to: string; subject: string; html: string }>) => {
        const { to, subject, html } = job.data;

        await this.mailer.sendMail({
          // utilise ta config defaults.from si définie dans MailModule
          to,
          subject,
          html,
        });

        // logs utiles

        console.log(`Email sent to ${to}`);
      },
      {
        // IMPORTANT : passe la connexion
        connection: this.redis.options, // ioredis instance
        concurrency: 1, // optionnel
      },
    );

    this.worker.on('failed', (job, err) => {
      console.error('[bullmq] job failed:', job?.name, job?.id, err?.message);
      if (job?.data.recovery && job.attemptsMade >= (job.opts.attempts ?? 1)) {
        const { email, code } = job.data.recovery;
        const cleanup = this.prisma.verificationTokens
          .deleteMany({ where: { email, code } })
          .catch((error) =>
            console.error('[bullmq] token cleanup failed:', error.message),
          );
        this.cleanups.add(cleanup);
        void cleanup.finally(() => this.cleanups.delete(cleanup));
      }
    });
    this.worker.on('error', (err) => {
      console.error('[bullmq] worker error:', err?.message);
    });
  }

  async onModuleDestroy() {
    if (this.worker) {
      await this.worker.close();
    }
    await Promise.allSettled(this.cleanups);
    await this.mailQueue.close();
  }
}
