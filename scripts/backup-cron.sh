#!/usr/bin/env bash
# Scheduled database backup, meant to be run from cron (see docs/BACKUP.md). Not used by the
# app itself - the admin panel's on-demand backup button hits the API directly instead; this
# covers the "back up automatically, even if the API is down" case cron is good for.
#
# Usage: run on a schedule via cron, e.g.:
#   0 3 * * * root /path/to/QRCODE-GEN/scripts/backup-cron.sh >> /var/log/qrgen-backup.log 2>&1
set -euo pipefail
cd "$(dirname "$0")/.."

# Cron doesn't inherit .env - load it explicitly rather than hardcoding credentials here.
set -a
source .env
set +a

RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
BACKUP_DIR="infra/data/backups"
FILE_NAME="backup-cron-$(date +%Y%m%dT%H%M%S).sql.gz"

mkdir -p "$BACKUP_DIR"

docker compose exec -T postgres pg_dump -U "$POSTGRES_USER" --no-owner --no-privileges \
  --clean --if-exists "$POSTGRES_DB" | gzip > "$BACKUP_DIR/$FILE_NAME"

echo "Backup written: $BACKUP_DIR/$FILE_NAME"

find "$BACKUP_DIR" -name 'backup-cron-*.sql.gz' -mtime "+$RETENTION_DAYS" -delete
