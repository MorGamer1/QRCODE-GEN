# QRGen

A self-hosted QR code generator platform with dynamic (editable, trackable) QR codes, real-time
scan analytics, and full visual customization - built as an alternative to hosted products like
QR Code Monkey, QR TIGER, or Bitly's QR tools, minus the vendor lock-in and per-scan pricing.

Everything runs on your own infrastructure: Postgres, Redis, and object storage you control, one
`docker compose up` away.

## Features

**QR codes**

- Static (content baked directly into the image) and dynamic (editable after printing - the QR
  image never has to change) codes
- 16 content types: URL, plain text, email, phone, SMS, WhatsApp, Wi-Fi, vCard, geo location,
  calendar event, crypto wallet, PDF, image, app store smart link, social profile, and a generic
  custom type
- Full visual customization: module shapes, eye/frame shapes, linear/radial gradients, embedded
  logos, decorative frames with labels, and 4 error-correction levels
- Export as PNG, SVG, PDF, EPS, or WEBP at custom sizes/DPI

**Dynamic redirects**

- Edit a dynamic QR code's destination any time without reprinting it
- Smart redirect rules: send scanners to different destinations by device type, country,
  language, or time window, with priority ordering between rules
- Password-protected, scan-limited, and scheduled (activate/deactivate at a given time) codes
- Custom HTTP status codes (301/302/307) per code

**Analytics**

- Every scan tracked: device, OS, browser, country/region/city, language, referrer, and UTM
  parameters
- Time-series and breakdown charts, a scan-origin world map, and CSV/JSON export
- GDPR-conscious by design: IP storage and hashing are both admin-configurable, and the raw IP is
  never persisted either way (see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md#privacy--gdpr))

**Management**

- Search, tag, categorize, favorite, and bulk-archive/delete QR codes
- API keys with scoped permissions for programmatic access, documented via Swagger at `/api/docs`

**Accounts & admin**

- Email/password auth (argon2id) with optional TOTP 2FA and recovery codes, plus optional Google/
  GitHub OAuth
- Admin panel: user management, cross-user QR oversight, platform settings, an audit log, and
  on-demand database backups

## Quick start (Docker Compose)

Requires Docker and Docker Compose. This starts Postgres, Redis, MinIO (S3-compatible storage),
the API, the analytics worker, the Next.js app, and an nginx reverse proxy - nginx is the only
port published to the host.

```bash
git clone https://github.com/MorGamer1/QRCODE-GEN.git
cd QRCODE-GEN
cp .env.example .env
# Edit .env: at minimum set POSTGRES_PASSWORD, REDIS_PASSWORD, S3_SECRET_ACCESS_KEY, and the
# three *_SECRET values (see the comment in .env.example for how to generate them).

docker compose up -d --build
```

Once the containers report healthy, the app is at `http://localhost` (or whatever
`PUBLIC_BASE_URL`/`NGINX_HTTP_PORT` you configured). See
**[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** for the full self-hosting guide: environment
variables, TLS, SMTP, OAuth, and scaling notes.

## Local development (without Docker)

```bash
corepack enable   # or: npm i -g pnpm
pnpm install

# Postgres/Redis/MinIO in containers, app processes on the host for fast hot-reload:
docker compose -f docker-compose.dev.yml up -d
cp apps/api/.env.example apps/api/.env

pnpm db:migrate
pnpm dev   # runs api + web in parallel via turbo
```

- API: `http://localhost:4000` (Swagger docs at `/api/docs`)
- Web: `http://localhost:3000`

`pnpm dev` doesn't start the analytics worker (its `dev` script only covers packages whose own
script is literally named `dev`, and the worker's is `dev:worker`) - redirects work fine without
it, but scans won't show up in analytics dashboards until something consumes the queue. Run it
separately, in its own terminal, when you need that:

```bash
pnpm --filter @qrgen/api dev:worker
```

See **[CONTRIBUTING.md](CONTRIBUTING.md)** for testing, linting, and the PR process.

## Tech stack

| Layer          | Stack                                                                                   |
| -------------- | --------------------------------------------------------------------------------------- |
| Monorepo       | pnpm workspaces + Turborepo                                                             |
| Backend        | NestJS, Prisma, PostgreSQL, Redis, BullMQ                                               |
| Frontend       | Next.js 15 (App Router), React 19, TanStack Query, Tailwind CSS, Radix UI               |
| Validation     | Zod schemas shared verbatim between frontend and backend (`packages/shared`)            |
| QR rendering   | Custom SVG engine (`packages/qr-engine`) built on top of `qrcode`'s matrix encoding     |
| Object storage | Any S3-compatible provider (bundled MinIO by default, or AWS S3/R2/B2/etc.)             |
| Testing        | Jest (backend unit + e2e), Vitest + Testing Library (frontend)                          |
| CI/CD          | GitHub Actions - lint, typecheck, tests, build, and Docker image validation on every PR |

## Repository layout

```
apps/
  api/      NestJS backend - REST API, redirect engine, analytics worker
  web/      Next.js frontend
packages/
  shared/   Zod schemas, enums, and types shared by both apps
  qr-engine/  SVG QR code rendering/styling engine
infra/
  docker/nginx/   nginx reverse proxy config used by docker-compose.yml
docs/       Architecture, deployment, and backup documentation
scripts/    Operational scripts (e.g. scheduled backups, see docs/BACKUP.md)
```

See **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** for how these pieces fit together.

## Documentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - system design, data flow, and scaling notes
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) - self-hosting guide
- [docs/BACKUP.md](docs/BACKUP.md) - backup/restore strategy
- [CONTRIBUTING.md](CONTRIBUTING.md) - local development and contribution guide
- [SECURITY.md](SECURITY.md) - vulnerability reporting

## License

MIT - see [LICENSE](LICENSE).
