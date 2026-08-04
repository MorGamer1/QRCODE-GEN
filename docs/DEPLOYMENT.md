# Self-hosting guide

## Prerequisites

- Docker Engine and Docker Compose v2 (`docker compose version` should print v2.x)
- A domain name pointed at the server, if you want QR codes to encode a real public URL instead
  of an IP address (recommended - see [Choosing `PUBLIC_BASE_URL`](#choosing-public_base_url))

## First-time setup

```bash
git clone https://github.com/MorGamer1/QRCODE-GEN.git
cd QRCODE-GEN
cp .env.example .env
```

Edit `.env`. At minimum, set these before starting anything (the stack refuses to start without
them - see the `${VAR:?...}` guards in `docker-compose.yml`):

| Variable                                                   | What it's for                                                                |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `POSTGRES_PASSWORD`                                        | Database password                                                            |
| `REDIS_PASSWORD`                                           | Redis password                                                               |
| `S3_SECRET_ACCESS_KEY`                                     | Object storage credentials (bundled MinIO's root password)                   |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `COOKIE_SECRET` | Session security - each must be 32+ characters and unique to your deployment |

Generate the three secrets with:

```bash
openssl rand -base64 32
```

Then bring the stack up:

```bash
docker compose up -d --build
```

This starts, in order: Postgres and Redis, MinIO (waits for it to report healthy), a one-off
`migrate` job that applies database migrations and exits, then the API, the analytics worker, the
Next.js app, and finally nginx. First startup takes a few minutes to build images; subsequent
`docker compose up -d` runs are fast. Check status with `docker compose ps` - everything should
settle into `running` (or, for `migrate`/`minio-init`, `exited (0)`, which is correct for a
one-off job).

The app is now at `http://localhost` (or `$PUBLIC_BASE_URL`, or port `$NGINX_HTTP_PORT` if you
changed it from 80). The first account you register becomes a regular user - see
[Creating an admin](#creating-an-admin) to promote it.

### Using pre-built images instead of building locally

Tagged releases are published to GitHub Container Registry (see
`.github/workflows/docker-publish.yml`) as `ghcr.io/morgamer1/qrcode-gen/api` and
`ghcr.io/morgamer1/qrcode-gen/web`. To use them instead of building from source, replace the
`build:` blocks for the `api`, `worker`, and `web` services in `docker-compose.yml` with
`image: ghcr.io/morgamer1/qrcode-gen/api:latest` (and `-web` for the web service; `worker` uses
the same api image) and run `docker compose up -d` (no `--build` needed).

## Choosing `PUBLIC_BASE_URL`

This is the origin baked into every **static** QR code's `/r/:code` short URL at the moment
it's created, and it cannot be changed retroactively for codes that already exist (the QR image
itself would need to be reprinted). Set it to your real, final public domain
(`https://qr.example.com`) before creating any QR codes you intend to print or share - not
`http://localhost`, unless this is genuinely a local-only/LAN deployment.

## Object storage

The bundled `minio` service works out of the box with no extra configuration - `S3_ENDPOINT`
defaults to it, and `minio-init` creates the bucket automatically on first startup. To use a real
S3-compatible provider (AWS S3, Cloudflare R2, Backblaze B2, etc.) instead:

1. Set `S3_ENDPOINT`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, and `S3_BUCKET` to
   that provider's values in `.env`.
2. Set `S3_PUBLIC_URL` to a URL your provider serves that bucket's objects from publicly (see the
   comment above it in `.env.example` - uploaded files are served as plain public URLs, not
   signed ones, since they're meant to be visible to anyone who scans the QR code they're
   attached to).
3. Comment out the `minio` and `minio-init` services in `docker-compose.yml` (and remove the
   `/files/` location block in `infra/docker/nginx/conf.d/default.conf` if you don't want nginx
   trying to route to a MinIO service that no longer exists).

## TLS / HTTPS

The bundled nginx config serves plain HTTP. For a real deployment, put a TLS-terminating layer in
front of it - the two common options:

- **A separate reverse proxy on the host** (Caddy, another nginx, or a platform load balancer)
  that terminates TLS and forwards plain HTTP to `$NGINX_HTTP_PORT`. This is the simplest option
  if you already run one for other services on the same machine.
- **Terminate TLS in this nginx directly**: mount your certificate and key into the `nginx`
  service in `docker-compose.yml` (add a `volumes:` entry), add a `listen 443 ssl;` server block
  to `infra/docker/nginx/conf.d/default.conf` with `ssl_certificate`/`ssl_certificate_key`
  pointing at the mounted paths, and uncomment the `return 301 https://$host$request_uri;` line
  already present in that file's HTTP server block to force the redirect. For a certificate
  that auto-renews, run [certbot](https://certbot.eff.org/) or
  [acme.sh](https://github.com/acmesh-official/acme.sh) on the host against the mounted volume,
  or swap the `nginx` image for `jonasal/nginx-certbot` if you'd rather have it managed inside
  the container.

Either way, once traffic to the app is HTTPS, update `PUBLIC_BASE_URL` and `WEB_BASE_URL` in
`.env` to `https://...` and redeploy (`docker compose up -d`) so cookies get marked `Secure` and
QR codes encode the right scheme.

## Email (SMTP)

Optional. Without `SMTP_HOST` set, the API logs verification/password-reset emails to its own
console instead of sending them (visible via `docker compose logs api`) - fine for trying the
app out, not fine for anyone but you to actually use it, since they'd never receive their
verification email. Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`, and
`SMTP_SECURE` in `.env` to a real SMTP provider (a transactional email service like Postmark,
SES, SendGrid, etc., or your own mail server) and redeploy.

## OAuth sign-in (optional)

Google and GitHub sign-in are independently optional - the login page only shows a provider's
button once both its `_CLIENT_ID` and `_CLIENT_SECRET` are set (checked live via
`GET /api/v1/auth/config`), and attempting to hit an unconfigured provider's route directly
returns a clear `501 Not Implemented` rather than a confusing OAuth error.

To enable one:

1. Create an OAuth app with the provider (Google Cloud Console / GitHub Developer Settings).
2. Set the authorized callback URL to `$PUBLIC_BASE_URL/api/v1/auth/{google,github}/callback`.
3. Set `{GOOGLE,GITHUB}_CLIENT_ID`, `{GOOGLE,GITHUB}_CLIENT_SECRET`, and
   `{GOOGLE,GITHUB}_CALLBACK_URL` (same URL as step 2) in `.env`, then redeploy.

## Privacy & GDPR

Two independent, admin-configurable toggles (Admin panel → Settings → Privacy, or
`SystemSetting.gdprStoreIp`/`gdprHashIp`) control what a scan's IP address is used for:

- **Store scanner IP data** (default on): look up device/browser/geo from the scanner's IP.
  Turning this off skips geo/IP-derived fields entirely for new scans.
- **Hash IP addresses**: store a one-way hash instead of deriving and keeping the geo lookup in
  a form traceable back to a specific IP. The raw IP itself is never persisted to the database
  either way - it only ever exists transiently in-memory during request handling.

## Creating an admin

The first user to register is a normal `USER`. Promote one to `ADMIN` directly in the database
(there's deliberately no self-service "become admin" flow). Substitute your own `POSTGRES_USER`/
`POSTGRES_DB` from `.env` if you changed them from the `.env.example` defaults (`qrgen`/`qrgen`):

```bash
docker compose exec postgres psql -U qrgen -d qrgen \
  -c "UPDATE users SET role = 'ADMIN' WHERE email = 'you@example.com';"
```

## Scaling

- **Worker**: the analytics worker (`worker` service) is stateless and safe to run multiple
  replicas of - `docker compose up -d --scale worker=3`. BullMQ handles job distribution across
  workers automatically.
- **API**: also stateless (sessions are JWT + Postgres-backed, not in-memory) - safe to scale the
  same way, though you'd need to put a load balancer in front of it instead of nginx's single
  `api:4000` upstream, or run multiple nginx-fronted API replicas behind a shared entry point.
- **Database**: the usual PostgreSQL scaling playbook applies (read replicas, connection
  pooling via PgBouncer if you're running many API replicas). See
  [docs/ARCHITECTURE.md](ARCHITECTURE.md#scaling-the-scan-table) for scan-table-specific advice
  at high volume.

## Updating

```bash
git pull
docker compose up -d --build   # rebuilds any changed images; migrate runs automatically
```

The `migrate` service runs `prisma migrate deploy` on every `up`, so schema changes in an update
are applied automatically before `api`/`worker` start (they both `depends_on: migrate:
condition: service_completed_successfully`).

## Backups

See [docs/BACKUP.md](BACKUP.md).

## Troubleshooting

- **`docker compose up` fails immediately citing a missing variable**: you skipped one of the
  required `.env` values listed above - the error names exactly which one.
- **`api`/`worker` stuck waiting, never becoming healthy**: check
  `docker compose logs migrate` first - if the migration job failed, dependents never start.
  Common cause: `POSTGRES_PASSWORD` in `.env` doesn't match what the `postgres` service was
  _originally_ initialized with (Postgres only applies `POSTGRES_PASSWORD` on a fresh, empty data
  directory - changing it in `.env` after the fact doesn't retroactively change the running
  database's password). Fix by updating the password inside Postgres to match, or wiping
  `infra/data/postgres` for a truly fresh start (**destroys all data**).
- **QR codes' logos/images 404 in the browser**: confirm `minio-init` completed successfully
  (`docker compose logs minio-init`) - it creates the bucket and sets the anonymous-read policy
  the `/files/` nginx route depends on.
