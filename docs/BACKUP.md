# Backups

## What's backed up

The admin panel's **Backups** page (and the underlying `POST /api/v1/admin/backups` endpoint,
admin/super-admin only) triggers a `pg_dump` of the whole database - schema and data,
gzip-compressed - to `BACKUP_DIR` (default `/app/backups`, bind-mounted to `./infra/data/backups` on
the host by `docker-compose.yml`, so it survives container recreation). This covers everything
in Postgres: users, QR codes, scan history, settings, audit log. It does **not** cover uploaded
files (logos, "Image" content-type assets) in object storage - see
[Object storage](#object-storage) below.

Dumps are named `backup-<timestamp>.sql.gz` and taken with `pg_dump --no-owner --no-privileges
--clean --if-exists`, meaning the dump itself contains `DROP ... IF EXISTS` statements ahead of
each `CREATE` - safe to restore over an existing (even non-empty) database of the same schema
without manually dropping tables first.

## On-demand backups

Admin panel → Backups → **Create backup**. Download or delete existing backups from the same
page. Fine for "back up right before I do something risky," not a substitute for the automated
schedule below - nothing triggers this on its own.

## Automated schedule (recommended)

Nothing in the app itself schedules backups - run `pg_dump` on a schedule from the host via cron,
independent of whether the API is up. `scripts/backup-cron.sh` does this (sources `.env` itself
rather than needing credentials hardcoded anywhere, and prunes local backups older than
`BACKUP_RETENTION_DAYS`, default 14). Point cron at it:

```bash
# /etc/cron.d/qrgen-backup - runs daily at 03:00
0 3 * * * root /path/to/QRCODE-GEN/scripts/backup-cron.sh >> /var/log/qrgen-backup.log 2>&1
```

Writing into `infra/data/backups` means these show up in the admin panel's list alongside
on-demand backups (the app matches any file named `backup-*.sql.gz` in `BACKUP_DIR`, not just
ones it created itself).

Pick a retention window and off-site sync frequency that match how much data loss you can
tolerate - daily backups with 14 days of local retention is a reasonable default, not a
one-size-fits-all recommendation.

## Off-site copies

Local backups protect against database corruption or a bad migration; they don't protect against
losing the whole machine. Sync `infra/data/backups/` to off-site storage after each backup runs -
[restic](https://restic.net/) (encrypted, deduplicated, supports S3/B2/etc. as a target) or
[rclone](https://rclone.org/) (simpler, plain file sync to any cloud storage) both work well. Add
a sync line to the end of `scripts/backup-cron.sh`, after it prints "Backup written: ...", e.g.:

```bash
rclone copy "$BACKUP_DIR/$FILE_NAME" remote:qrgen-backups/
```

## Restoring

**Stop the API and worker first** so nothing writes to the database mid-restore. Substitute your
own `POSTGRES_USER`/`POSTGRES_DB` from `.env` if you changed them from the defaults, and the
actual backup filename you're restoring:

```bash
docker compose stop api worker

gunzip -c infra/data/backups/backup-2026-01-15T03-00-00-000Z.sql.gz | \
  docker compose exec -T postgres psql -U qrgen -d qrgen

docker compose start api worker
```

Because dumps include `--clean --if-exists`, this drops and recreates each table from the dump -
you do not need to manually empty the database first, but you should still expect this to fully
replace current data with the backup's contents.

## Object storage

Uploaded files (QR logos, "Image" content-type assets) live in object storage (MinIO by default),
not Postgres, and aren't covered by the `pg_dump`-based backups above. If you're running the
bundled MinIO service, back up its data directory the same way:
`infra/data/minio/` - stop the `minio` service, copy/sync that directory, restart. If you're
using external S3/R2/B2, rely on that provider's own backup/versioning features instead.
