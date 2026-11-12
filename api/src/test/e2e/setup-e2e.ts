process.env['NODE_ENV'] = 'test';

process.env['DATABASE_URL'] =
  process.env['DATABASE_URL'] || 'mysql://root:root@localhost:3307/blog_test';

const databaseName = new URL(process.env['DATABASE_URL']).pathname.slice(1);
if (!/(?:^|_)(?:test|e2e)(?:_|$)/i.test(databaseName)) {
  throw new Error(
    'Les e2e exigent une base dédiée dont le nom contient test ou e2e.',
  );
}

process.env['REDIS_URL'] =
  process.env['E2E_REDIS_URL'] ?? 'redis://127.0.0.1:6380/0';

process.env['SECRET_KEY'] =
  process.env['SECRET_KEY'] ||
  Buffer.from('12345678901234567890123456789012').toString('base64');

jest.setTimeout(30000);

// Keep real Argon2 hashing while reducing its cost for functional tests.
process.env['ARGON2_TIME'] = '1';
process.env['ARGON2_MEMORY_KIB'] = '8192';
