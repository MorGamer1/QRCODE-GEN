# Contributing

## Local setup

```bash
corepack enable   # or: npm i -g pnpm@10
pnpm install

docker compose -f docker-compose.dev.yml up -d   # Postgres, Redis, MinIO only
cp apps/api/.env.example apps/api/.env           # already matches the containers above

pnpm db:migrate
pnpm dev   # api (:4000) + web (:3000), via turbo, in parallel
```

`apps/web` needs no environment file for local dev - it talks to the API via a same-origin
`/api/v1/...` path, proxied to `localhost:4000` by a Next.js rewrite (see
`apps/web/next.config.mjs`) so there's no separate origin/CORS to configure.

`pnpm dev` doesn't start the analytics worker - working on anything scan-analytics-related needs
it running separately (`pnpm --filter @qrgen/api dev:worker`), since turbo's `dev` task only
picks up scripts literally named `dev`, and the worker's is `dev:worker`.

## Project structure

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for how the pieces fit together. Short version:
`apps/api` (NestJS) and `apps/web` (Next.js) both depend on `packages/shared` (Zod schemas -
the single source of truth for validation, used by both sides) and `packages/qr-engine` (QR
rendering). Turborepo builds dependencies before dependents automatically; you don't need to
manually build `packages/*` before working on an app.

## Before opening a PR

```bash
pnpm lint
pnpm typecheck
pnpm test                              # unit tests: shared, qr-engine, api, web
pnpm --filter @qrgen/api test:e2e      # needs the dev-compose Postgres/Redis running
```

All four run in CI (`.github/workflows/ci.yml`) on every PR; running them locally first saves a
round trip. `pnpm lint:fix` auto-fixes what it can.

### Writing tests

- **Pure logic** (Zod schemas, encoders, the redirect rule matcher, etc.) - plain Jest/Vitest
  unit tests, no mocking infrastructure needed. See `packages/shared/src/content/encoders.spec.ts`
  for the pattern.
- **A service with Prisma/Redis dependencies** - construct it directly with a hand-written mock
  object (`{ session: { create: jest.fn(), ... } }`) rather than NestJS's full
  `Test.createTestingModule` DI machinery, unless the test specifically needs real DI wiring.
  See `apps/api/src/modules/auth/token.service.spec.ts`.
- **A full request/response flow** - an e2e test under `apps/api/test/*.e2e-spec.ts`, run against
  the real app and a real (throwaway) database via Supertest. These hit the backend directly with
  no nginx in front, so routes are at their real internal path (`/api/r/:code`, not the
  nginx-rewritten public `/r/:code` - see the note in `docs/ARCHITECTURE.md` about why those
  differ) and cookies scoped to `Path=/r` won't auto-attach the way a browser behind nginx would
  - see the comments in `apps/api/test/redirect.e2e-spec.ts` for how to work around that when it
    matters for what you're testing.
- **Frontend UI you can't practically unit-test** (the QR wizard's live preview, drag-and-drop,
  etc.) - these are better covered by manually exercising the feature in a browser during
  development than by a brittle component test; use your judgement.

## Code style

- No comments explaining _what_ code does - names should already make that clear. A comment
  earns its place by explaining a non-obvious _why_: a workaround, an invariant, a tradeoff a
  future reader would otherwise have to rediscover the hard way.
- Don't add abstractions, config options, or error handling for cases that can't currently
  happen. Match the existing patterns in the file/module you're editing over introducing a new
  one.
- Zod schemas in `packages/shared` are the source of truth for validation - if you're adding a
  field, add it there first, then wire the backend DTO and frontend form to it, rather than
  validating the same shape twice in different ways.

## Commit messages

Explain _why_, not just _what_ - "what changed" is already visible in the diff. If you found and
fixed a real bug while doing something else, say so explicitly and separately from the main
change, so it doesn't get lost in review.

## Database migrations

```bash
pnpm db:migrate   # creates + applies a new migration from your schema.prisma changes
```

Never hand-edit a migration that's already been applied anywhere but your own local database -
create a new one instead, the same way you would with `git`.
