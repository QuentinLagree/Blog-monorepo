FROM node:20-bookworm-slim
WORKDIR /app
RUN corepack enable
ENV PNPM_STORE_DIR=/pnpm/store

# outils de build minimes (pour d'autres modules natifs)
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
 && rm -rf /var/lib/apt/lists/*

COPY pnpm-lock.yaml package.json ./
RUN pnpm install --frozen-lockfile

COPY . .
