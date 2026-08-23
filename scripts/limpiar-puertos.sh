#!/bin/sh
# Script para liberar puertos comunes de desarrollo (8080, 8081, 5173)
PUERTOS=""
for puerto in $PUERTOS; do
  pid=$(lsof -ti:$puerto 2>/dev/null)
  if [ -n "$pid" ]; then
    echo "Liberando puerto $puerto (PID: $pid)..."
    kill -9 $pid 2>/dev/null
  else
    echo "Puerto $puerto libre."
  fi
done
