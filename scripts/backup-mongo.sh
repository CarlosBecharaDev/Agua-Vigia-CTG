#!/usr/bin/env bash
set -euo pipefail

# Respaldo de Mongo via mongodump dentro del contenedor. No expone el puerto de Mongo al host ni
# depende de un volumen extra: --archive sale por stdout de `docker compose exec` y este script lo
# redirige a un archivo comprimido en el host. Pensado para cron/Task Scheduler contra
# docker-compose.prod.yml — ver docs/ingenieria/respaldo-y-restauracion.md.
#
# Uso: ./scripts/backup-mongo.sh [directorio-de-respaldos] [dias-de-retencion]

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
DIRECTORIO_RESPALDOS="${1:-./respaldos-mongo}"
DIAS_RETENCION="${2:-30}"
BASE_DE_DATOS="${MONGO_INITDB_DATABASE:-aguavigia}"

mkdir -p "$DIRECTORIO_RESPALDOS"

MARCA_DE_TIEMPO="$(date -u +%Y%m%dT%H%M%SZ)"
ARCHIVO="$DIRECTORIO_RESPALDOS/aguavigia-mongo-${MARCA_DE_TIEMPO}.archive.gz"

docker compose -f "$COMPOSE_FILE" exec -T mongo \
  mongodump --db "$BASE_DE_DATOS" --archive --gzip > "$ARCHIVO"

echo "Respaldo de Mongo escrito en $ARCHIVO ($(du -h "$ARCHIVO" | cut -f1))"

# Retencion: borra respaldos mas viejos que DIAS_RETENCION dias.
find "$DIRECTORIO_RESPALDOS" -name 'aguavigia-mongo-*.archive.gz' -mtime "+${DIAS_RETENCION}" -print -delete
