process.env["NODE_ENV"] = 'test';

process.env["DATABASE_URL"] =
  process.env["DATABASE_URL"] ||
  'mysql://root:password@localhost:3306/blog_test';

process.env["REDIS_URL"] = 'redis://localhost:6379';

process.env["SECRET_KEY"] =
  process.env["SECRET_KEY"] ||
  Buffer.from('12345678901234567890123456789012').toString('base64');

jest.setTimeout(30000);