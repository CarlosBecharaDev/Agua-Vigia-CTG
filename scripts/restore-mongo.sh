#!/usr/bin/env bash
set -euo pipefail

# Restaura un respaldo generado por backup-mongo.sh. DESTRUCTIVO: mongorestore --drop borra cada
# coleccion existente antes de restaurarla desde el archivo — exige confirmacion explicita.
# Ver docs/ingenieria/respaldo-y-restauracion.md para el procedimiento completo (incluye fotos).
#
# Uso: ./scripts/restore-mongo.sh <archivo.archive.gz>

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
ARCHIVO="${1:?Uso: restore-mongo.sh <archivo.archive.gz>}"
BASE_DE_DATOS="${MONGO_INITDB_DATABASE:-aguavigia}"

if [ ! -f "$ARCHIVO" ]; then
  echo "No existe: $ARCHIVO" >&2
  exit 1
fi

echo "Esto reemplaza el contenido de la base '$BASE_DE_DATOS' con $ARCHIVO."
read -r -p "Escriba 'restaurar' para confirmar: " CONFIRMACION
if [ "$CONFIRMACION" != "restaurar" ]; then
  echo "Cancelado."
  exit 1
fi

docker compose -f "$COMPOSE_FILE" exec -T mongo \
  mongorestore --db "$BASE_DE_DATOS" --archive --gzip --drop < "$ARCHIVO"

echo "Restauracion de Mongo completa."
