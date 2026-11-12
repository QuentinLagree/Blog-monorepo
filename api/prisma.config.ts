import path from 'node:path';
import { defineConfig } from 'prisma/config';
import fs from 'node:fs';
import { parseEnv } from 'node:util';

const envFile = path.join(process.cwd(), '.env');
if (fs.existsSync(envFile)) {
  for (const [key, value] of Object.entries(
    parseEnv(fs.readFileSync(envFile, 'utf8')),
  )) {
    process.env[key] ??= value;
  }
}

export default defineConfig({
  schema: path.join('src', 'config', 'database', 'schema.merged.prisma'),

  migrations: {
    path: path.join('src', 'config', 'database', 'migrations'),
  },
});
