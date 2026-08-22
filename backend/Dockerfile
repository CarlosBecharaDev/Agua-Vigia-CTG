# docker build -t ctg-backend . && docker run -p 8080:8080 ctg-backend

# ---- Etapa de build ----
FROM eclipse-temurin:21-jdk AS build
WORKDIR /build

# Capa de dependencias separada del codigo: cambia mucho menos seguido,
# así que Docker la cachea y solo se re-descarga cuando cambia el pom.xml.
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN ./mvnw dependency:go-offline -B

COPY src ./src
RUN ./mvnw package -DskipTests -B

# ---- Etapa de ejecucion ----
FROM eclipse-temurin:21-jre AS runtime
WORKDIR /app

# curl: eclipse-temurin:21-jre no lo trae por defecto y lo necesita el
# HEALTHCHECK de docker-compose.yml contra /actuator/health.
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

# Sin root: el proceso de la aplicacion no necesita privilegios de root en el contenedor.
# chown de /app completo, no solo del jar: AlmacenamientoLocalAdapter (M10) crea
# data/fotos/ en tiempo de arranque, y sin esto el usuario sin privilegios no puede escribir
# en un WORKDIR que Docker crea como root — el contenedor no llegaba a arrancar.
RUN addgroup --system aguavigia && adduser --system --ingroup aguavigia aguavigia
COPY --from=build /build/target/*.jar app.jar
RUN chown -R aguavigia:aguavigia /app
USER aguavigia

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
