# syntax=docker/dockerfile:1.7
#
# Builds @qrgen/api. The same "runtime" image doubles as three docker-compose services:
#   - api:     node dist/main.js    (default CMD below)
#   - worker:  node dist/worker.js  (command: override - `nest build` compiles both entry
#              points from apps/api/src in one pass, see apps/api/nest-cli.json)
#   - migrate: uses the "build" stage instead of "runtime" (via compose `target: build`) and
#              runs `pnpm --filter @qrgen/api exec prisma migrate deploy` - the `prisma` CLI is
#              a devDependency and is intentionally not present in the pruned runtime stage.
#
# Build context MUST be the monorepo root (see docker-compose.yml `build.context: .`) so pnpm
# can resolve the workspace: protocol against the root lockfile and every package.json.

FROM node:25-slim AS base
RUN corepack enable
ENV PNPM_HOME="/pnpm" PATH="$PNPM_HOME:$PATH"
WORKDIR /app

# -----------------------------------------------------------------------------------------
# build: full workspace install (incl. devDependencies), compiles @qrgen/api and the
# workspace packages it depends on, then prunes to a self-contained, production-only,
# non-symlinked copy via `pnpm deploy`.
# -----------------------------------------------------------------------------------------
FROM base AS build

# python3/make/g++: fallback source build for native deps (argon2, sharp) on platforms without
# a matching prebuilt binary. openssl: needed by Prisma's engines, here and in `runtime` below.
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ openssl \
    && rm -rf /var/lib/apt/lists/*

COPY . .

RUN --mount=type=cache,id=qrgen-pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile

# Explicit, not left to @prisma/client's postinstall hook: verified live (via GitHub Actions,
# this sandbox has no working Docker daemon to test builds directly) that postinstall's schema
# auto-discovery does not reliably resolve apps/api/prisma/schema.prisma when `pnpm install`
# runs from the monorepo root - it silently generated a stale/empty client, and every field
# added since (expiresAt, passwordHash, scanLimit, the whole RedirectRule model, ...) failed
# `nest build`'s typecheck with "does not exist on type". `prisma generate` only needs
# env("DATABASE_URL") in the schema to resolve to *some* string - it never connects to a
# database at generate time. The real value is injected at container runtime by
# docker-compose.yml.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
RUN pnpm --filter=@qrgen/api exec prisma generate
RUN pnpm turbo run build --filter=@qrgen/api...

# pnpm v10's default `deploy` requires `inject-workspace-packages=true` set repo-wide, which
# would change how every `pnpm install` resolves workspace: deps just for this one Docker step.
# --legacy avoids that (verified: still correctly includes dist/, prisma/, and every
# production dependency incl. prebuilt native addons for argon2/sharp - it does NOT respect
# .gitignore, so this step also happens to be the reason `.dockerignore` must exclude .env
# itself; deploy does not filter that out).
RUN pnpm --filter=@qrgen/api deploy --prod --legacy /prod/api

# -----------------------------------------------------------------------------------------
# runtime: nothing but the pruned output + its own production node_modules. No compilers, no
# devDependencies, no monorepo source, no lockfile.
# -----------------------------------------------------------------------------------------
FROM node:25-slim AS runtime

# openssl: Prisma's query engine binary dynamically links against libssl at runtime, not just
# at generate time. dumb-init: correct SIGTERM/SIGINT forwarding + zombie reaping as PID 1.
RUN apt-get update && apt-get install -y --no-install-recommends openssl dumb-init \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /app/backups && chown node:node /app/backups

WORKDIR /app
ENV NODE_ENV=production

COPY --from=build --chown=node:node /prod/api ./

USER node
EXPOSE 4000
VOLUME ["/app/backups"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD ["node", "-e", "fetch('http://127.0.0.1:'+(process.env.PORT||4000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
