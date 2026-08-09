# Sin probar end-to-end: esta maquina no tiene un daemon de Docker (solo el
# cliente CLI, ver docs/gestion/registro-de-bloqueos.md, BL-002 cerrado).
# Revisar antes de confiar en produccion: docker build -t ctg-frontend . && docker run -p 8080:80 ctg-frontend
# `npm run build` sí se verificó fuera de Docker: genera dist/ con index.html + assets con hash.

# ---- Etapa de build ----
FROM node:22-alpine AS build
WORKDIR /build

# Capa de dependencias separada del codigo: cambia mucho menos seguido,
# así que Docker la cachea y solo se re-descarga cuando cambia package-lock.json.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- Etapa de ejecucion ----
FROM nginx:1.27-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /build/dist /usr/share/nginx/html

EXPOSE 80
