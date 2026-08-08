# Sin probar end-to-end: esta maquina no tiene un daemon de Docker (solo el
# cliente CLI, instalado para verificar C0 -- ver docs/gestion/registro-de-bloqueos.md).
# Revisar antes de confiar en produccion: docker build -t ctg-backend . && docker run -p 8080:8080 ctg-backend

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

# Sin root: el proceso de la aplicacion no necesita privilegios de root en el contenedor.
RUN addgroup --system aguavigia && adduser --system --ingroup aguavigia aguavigia
COPY --from=build /build/target/*.jar app.jar
RUN chown aguavigia:aguavigia app.jar
USER aguavigia

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
