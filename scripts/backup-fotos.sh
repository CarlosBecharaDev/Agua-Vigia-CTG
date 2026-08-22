#!/usr/bin/env bash
set -euo pipefail

# Respaldo del volumen fotos-data (evidencia ciudadana de M10) — no vive en Mongo, asi que
# backup-mongo.sh no lo cubre. Empaqueta /app/data/fotos a traves del contenedor backend en vez de
# nombrar el volumen Docker directamente: el nombre real depende de COMPOSE_PROJECT_NAME, y esto
# funciona igual sin importar como se llame.
#
# Uso: ./scripts/backup-fotos.sh [directorio-de-respaldos] [dias-de-retencion]

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
DIRECTORIO_RESPALDOS="${1:-./respaldos-fotos}"
DIAS_RETENCION="${2:-30}"

mkdir -p "$DIRECTORIO_RESPALDOS"

MARCA_DE_TIEMPO="$(date -u +%Y%m%dT%H%M%SZ)"
ARCHIVO="$DIRECTORIO_RESPALDOS/aguavigia-fotos-${MARCA_DE_TIEMPO}.tar.gz"

docker compose -f "$COMPOSE_FILE" exec -T backend \
  tar czf - -C /app/data fotos > "$ARCHIVO"

echo "Respaldo de fotos escrito en $ARCHIVO ($(du -h "$ARCHIVO" | cut -f1))"

find "$DIRECTORIO_RESPALDOS" -name 'aguavigia-fotos-*.tar.gz' -mtime "+${DIAS_RETENCION}" -print -delete
