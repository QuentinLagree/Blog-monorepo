FROM node:22-bookworm-slim
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.15.0 --activate
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ libsodium-dev ca-certificates && rm -rf /var/lib/apt/lists/*
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run prisma:build && DATABASE_URL=mysql://build:build@localhost:3306/build pnpm run prisma:generate && pnpm run build
RUN mkdir -p /app/logs_files && chown -R node:node /app/logs_files
ENV NODE_ENV=production
USER node
EXPOSE 3000
CMD ["sh", "-c", "pnpm run prisma:deploy && exec node dist/main.js"]
