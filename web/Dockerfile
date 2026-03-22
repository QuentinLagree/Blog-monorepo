FROM node:20-alpine
WORKDIR /app
RUN corepack enable
ENV PNPM_STORE_DIR=/pnpm/store

# Build deps + headers
RUN apk add --no-cache python3 make g++ git libsodium libsodium-dev

# Forcer la compilation
ENV npm_config_build_from_source=true
ENV SODIUM_INSTALL=build
ENV npm_config_target_libc=musl

COPY pnpm-lock.yaml package.json ./
RUN pnpm install --frozen-lockfile

COPY . .
# Par sécurité, recompile explicitement
RUN pnpm rebuild sodium-native
