import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { MailerService } from '@nestjs-modules/mailer';
import { Queue, QueueEvents } from 'bullmq';
import Redis from 'ioredis';
import { PrismaService } from 'src/commons/prisma/prisma.service';
import { REDIS } from 'src/commons/redis/redis.token';
import { RedisService } from 'src/commons/redis/redis.service';
import { BullMQService } from 'src/commons/mailing/bullmq/bullmq.service';
import { MailingService } from 'src/commons/mailing/mailing.service';
import { PasswordService } from 'src/commons/services/argon.service';
import { ArticleService } from 'src/modules/post/posts.service';
import { UserService } from 'src/modules/user/user.service';
import { UserPreferenceService } from 'src/modules/user-preferences/user-preferences.service';
import { AuthService } from 'src/modules/auth/auth.service';
import { PasswordNotMatchException } from 'src/modules/auth/exceptions/password-not-same.exception';
import { createE2EApp } from './helpers/create-e2e-app';
import { createTestUser } from './helpers/create_user-helper-e2e';
import { createTestPost } from './helpers/post.helper-e2e';
import { resetDatabase } from './helpers/reset-database.helper-e2e';

// Complements HTTP scenarios for service methods with no public endpoint.
describe('Services integration with MySQL and Redis', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let passwords: PasswordService;
  let redis: Redis;
  beforeAll(async () => {
    app = await createE2EApp();
    prisma = app.get(PrismaService);
    passwords = app.get(PasswordService);
    redis = app.get(REDIS);
    await redis.ping();
  });
  beforeEach(async () => {
    await resetDatabase(prisma);
  });
  afterAll(async () => {
    if (app) await app.close();
  });

  it('should count all, published and draft posts in the database', async () => {
    const user = await createTestUser(prisma, passwords);
    const published = await createTestPost(prisma, user.id);
    await createTestPost(prisma, user.id, { published_at: null });
    const articles = app.get(ArticleService);
    await expect(articles.count()).resolves.toBe(2);
    await expect(articles.count(true)).resolves.toBe(1);
    await expect(articles.count(false)).resolves.toBe(1);
    await expect(
      articles.indexOneWhere({ id: published.id }),
    ).resolves.toMatchObject({ id: published.id });
    await expect(articles.indexOneWhere({ id: 999999 })).resolves.toBeNull();
  });

  it('should count real likes and report the current user relationship', async () => {
    const user = await createTestUser(prisma, passwords);
    const post = await createTestPost(prisma, user.id);
    const users = app.get(UserService);
    const articles = app.get(ArticleService);
    const payload = { user_id: user.id, post_id: post.id };
    await expect(users.checkIfUserLikedPost(payload)).resolves.toBe(false);
    await users.addLike(payload);
    await users.addLike(payload);
    await expect(users.checkIfUserLikedPost(payload)).resolves.toBe(true);
    await expect(articles.getLikeCount(post.id)).resolves.toEqual({
      liked: false,
      likesCount: 1,
    });
    await users.unlikePost(payload);
    await expect(articles.getLikeCount(post.id)).resolves.toEqual({
      liked: false,
      likesCount: 0,
    });
  });

  it('should return default visibility and respect saved private preferences', async () => {
    const user = await createTestUser(prisma, passwords);
    const preferences = app.get(UserPreferenceService);
    await expect(preferences.isProfileVisible(user.id)).resolves.toBe(true);
    await preferences.updatePreferences(user.id, { profileVisible: false });
    await expect(preferences.isProfileVisible(user.id)).resolves.toBe(false);
  });

  it('should persist a Redis value with its TTL', async () => {
    const cache = app.get(RedisService);
    const key = 'blog:e2e:cache:' + process.pid;
    try {
      await expect(cache.get(key)).resolves.toBeNull();
      await cache.set(key, 'test-value', 30);
      await expect(cache.get(key)).resolves.toBe('test-value');
      const ttl = await redis.ttl(key);
      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(30);
    } finally {
      await redis.del(key);
    }
  });

  it('should render the actual welcome email template', async () => {
    const user = await createTestUser(prisma, passwords);
    const options = await app.get(MailingService).getOptionsWelcomeMail(user);
    expect(options.to).toBe(user.email);
    expect(options.subject).toBe('Bienvenue !');
    expect(options.html).toContain(user.pseudo);
    expect(options.html).not.toContain('{{username}}');
  });

  it('should not request a rehash for current password hashing options', async () => {
    const hash = await passwords.hashPassword('password12345');
    await expect(passwords.needsRehash(hash)).resolves.toBe(false);
  });

  it('should apply password confirmation rules through the real auth service', async () => {
    const auth = app.get(AuthService);
    await expect(
      auth.throwAnNotSamePasswordExceptionIfNotSame(
        'password12345',
        'password12345',
      ),
    ).resolves.toBeUndefined();
    await expect(
      auth.throwAnNotSamePasswordExceptionIfNotSame(
        'password12345',
        'differentPassword',
      ),
    ).rejects.toThrow(PasswordNotMatchException);
  });

  it.each([false, true])(
    'should process a real BullMQ job with retry=%s without external delivery',
    async (retry) => {
      const queue = new Queue('mail', {
        connection: {
          host: redis.options.host,
          port: redis.options.port,
          db: redis.options.db,
        },
      });
      let resolveSent: () => void;
      const sent = new Promise<void>((resolve) => {
        resolveSent = resolve;
      });
      const sendMail = jest.fn().mockImplementation(async () => {
        resolveSent();
        return {};
      });
      if (retry)
        sendMail.mockRejectedValueOnce(new Error('Temporary SMTP failure'));
      const worker = new BullMQService(
        redis,
        queue,
        {
          sendMail,
        } as unknown as MailerService,
        prisma,
      );
      let timer: ReturnType<typeof setTimeout>;
      try {
        worker.onModuleInit();
        const message = {
          to: 'recipient@test.com',
          subject: 'Integration test',
          html: '<p>Test</p>',
        };
        await queue.add('mail', message, {
          attempts: retry ? 2 : 1,
          backoff: { type: 'fixed', delay: 20 },
          removeOnComplete: true,
          removeOnFail: true,
        });
        await Promise.race([
          sent,
          new Promise<never>((_, reject) => {
            timer = setTimeout(
              () =>
                reject(new Error('Mail worker did not process the test job')),
              5000,
            );
          }),
        ]);
        expect(sendMail).toHaveBeenCalledWith(message);
        expect(sendMail).toHaveBeenCalledTimes(retry ? 2 : 1);
      } finally {
        clearTimeout(timer!);
        await worker.onModuleDestroy();
        await queue.close();
      }
    },
  );

  it.each([false, true])(
    'should release only the matching reset token after terminal mail failure, stale=%s',
    async (stale) => {
      const email = 'terminal@test.com',
        code = '1234567890abcdef1234567890abcdef';
      const user = await createTestUser(prisma, passwords, { email });
      await prisma.verificationTokens.create({
        data: {
          userId: user.id,
          email,
          code: stale ? 'abcdefabcdefabcdefabcdefabcdefab' : code,
          expired_at: new Date(Date.now() + 60000),
        },
      });
      const connection = {
        host: redis.options.host,
        port: redis.options.port,
        db: redis.options.db,
      };
      const queue = new Queue('mail', { connection });
      const events = new QueueEvents('mail', { connection });
      await events.waitUntilReady();
      const worker = new BullMQService(
        redis,
        queue,
        {
          sendMail: jest
            .fn()
            .mockRejectedValue(new Error('SMTP permanently unavailable')),
        } as unknown as MailerService,
        prisma,
      );
      worker.onModuleInit();
      const job = await queue.add(
        'mail',
        {
          to: email,
          subject: 'Reset',
          html: 'Test',
          recovery: { email, code },
        },
        { attempts: 1 },
      );
      try {
        await expect(job.waitUntilFinished(events, 5000)).rejects.toThrow(
          'SMTP permanently unavailable',
        );
        await worker.onModuleDestroy();
        expect(await prisma.verificationTokens.count()).toBe(stale ? 1 : 0);
      } finally {
        await worker.onModuleDestroy();
        await events.close();
        // A fresh connection removes only this failed test job, not Redis data.
        const cleanup = new Queue('mail', { connection });
        await cleanup.remove(job.id!);
        await cleanup.close();
      }
    },
  );
});
