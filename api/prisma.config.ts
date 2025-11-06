import path from 'node:path';
import { defineConfig } from 'prisma/config';
import 'dotenv/config';

export default defineConfig({
  schema: path.join('src', 'config', 'database'),

  migrations: {
    path: path.join('src', 'config', 'database', 'migrations'),
  },

});