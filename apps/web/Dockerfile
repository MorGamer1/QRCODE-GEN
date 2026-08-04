# syntax=docker/dockerfile:1.7
#
# Builds @qrgen/web using Next.js `output: "standalone"` (see apps/web/next.config.ts), which
# already traces and prunes exactly the node_modules files the server needs at runtime - no
# `pnpm deploy` step required here (unlike apps/api/Dockerfile).
#
# Build context MUST be the monorepo root (see docker-compose.yml `build.context: .`).

FROM node:26-slim AS base
RUN corepack enable
ENV PNPM_HOME="/pnpm" PATH="$PNPM_HOME:$PATH"
WORKDIR /app

# -----------------------------------------------------------------------------------------
# build
# -----------------------------------------------------------------------------------------
FROM base AS build
COPY . .

RUN --mount=type=cache,id=qrgen-pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile

# `rewrites()` in next.config.ts reads API_URL at BUILD time (Next resolves rewrite targets
# once, not per-request), so this has to be a build arg, not just a runtime environment
# variable - a plain `environment:` entry in docker-compose.yml would silently have no effect.
# It only matters as a same-origin dev-parity fallback for requests that somehow reach
# Next.js directly: nginx routes /api and /r straight to the api service before requests ever
# reach this container in every real deployment. Defaulting it to the compose service name
# keeps the unused fallback correct anyway, instead of pointing at a nonexistent localhost:4000
# inside this container.
ARG API_URL=http://api:4000
ENV API_URL=$API_URL

RUN pnpm turbo run build --filter=@qrgen/web...

# -----------------------------------------------------------------------------------------
# runtime: Next.js standalone output. In a pnpm monorepo this mirrors the workspace root
# layout instead of flattening to it - the real entry point is apps/web/server.js, and
# apps/web/.next/static + apps/web/public are deliberately excluded from the standalone trace
# (for caching reasons) and must be copied in separately. Verified against a real build in
# this repo; see the commit message for the exact tree.
# -----------------------------------------------------------------------------------------
FROM node:26-slim AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends dumb-init \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0

COPY --from=build --chown=node:node /app/apps/web/.next/standalone ./
COPY --from=build --chown=node:node /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=node:node /app/apps/web/public ./apps/web/public

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD ["node", "-e", "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/').then(r=>process.exit(r.status<500?0:1)).catch(()=>process.exit(1))"]

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "apps/web/server.js"]
