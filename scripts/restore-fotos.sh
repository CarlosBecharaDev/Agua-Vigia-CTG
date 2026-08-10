#!/usr/bin/env bash
set -euo pipefail

# Restaura un respaldo generado por backup-fotos.sh. DESTRUCTIVO: vacia /app/data/fotos dentro del
# contenedor backend antes de extraer — exige confirmacion explicita.
#
# Uso: ./scripts/restore-fotos.sh <archivo.tar.gz>

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
ARCHIVO="${1:?Uso: restore-fotos.sh <archivo.tar.gz>}"

if [ ! -f "$ARCHIVO" ]; then
  echo "No existe: $ARCHIVO" >&2
  exit 1
fi

echo "Esto reemplaza todo el contenido de /app/data/fotos en el contenedor backend con $ARCHIVO."
read -r -p "Escriba 'restaurar' para confirmar: " CONFIRMACION
if [ "$CONFIRMACION" != "restaurar" ]; then
  echo "Cancelado."
  exit 1
fi

docker compose -f "$COMPOSE_FILE" exec -T backend sh -c 'rm -rf /app/data/fotos/* /app/data/fotos/.[!.]*' 2>/dev/null || true
docker compose -f "$COMPOSE_FILE" exec -T backend tar xzf - -C /app/data < "$ARCHIVO"

echo "Restauracion de fotos completa."
