# Cap├¡tulo II ΓÇö Marco referencial

> ESTRUCTURA SIN VALIDAR CONTRA LA PLANTILLA OFICIAL
>
> Este cap├¡tulo se redact├│ contra el ├¡ndice reconstruido en `README.md` de este directorio. La
> plantilla institucional del Tecnol├│gico Comfenalco no est├í a├║n validada (tarea pendiente de D1,
> `ADR-021`); t├¡tulos y numeraci├│n pueden diferir. Las fuentes citadas en cada secci├│n son los
> documentos del repositorio ΓÇö transformar y citar, no inventar. Las referencias externas (normas,
> jurisprudencia) en APA 7 se consolidan en `referencias.md` solo despu├⌐s de verificarse una por una.

---

## 1. Antecedentes

**Antecedente contextual.** Cartagena de Indias registra desde 2023 fallas recurrentes de
continuidad en el acueducto operado por Acuacar, en concesi├│n con Veolia vigente hasta 2034
(`docs/brief.md`). Entre mayo y julio de 2026 los racionamientos sectorizados afectaron hasta al
**15 % de la poblaci├│n**; la planta El Bosque, que abastece cerca del **90 %** del agua potable de la
ciudad, redujo su capacidad disponible por proliferaci├│n de algas (`MEMORY.md` ┬º Contexto del problema;
`docs/brief.md`). Este contexto delimita un problema que no es de infraestructura sino de informaci├│n:
el vecino no sabe qu├⌐ est├í pasando y no tiene d├│nde consultarlo despu├⌐s (`docs/brief.md` ┬º Por qu├⌐
existe este problema).

**Antecedente jur├¡dico.** En junio de 2026 el **Tribunal Administrativo de Bol├¡var** dict├│ medidas
cautelares ordenando al operador *socializar previamente* cada interrupci├│n, con tiempos exactos y
condiciones (`MEMORY.md`; `docs/brief.md`). Es el hecho que fundamenta el proyecto: convierte la falta
de aviso en un incumplimiento verificable y exige, para cumplirse, que exista un canal de aviso
estructurado y trazable ΓÇö que hoy no existe en la web del operador, la prensa ni los grupos de WhatsApp
(`docs/brief.md` ┬º Qu├⌐ lo hace distinto).

**Antecedente t├⌐cnico del equipo.** El proyecto previo del equipo (ODYXS) us├│ MVC monol├¡tico con
Thymeleaf y MySQL, donde los controladores concentraban l├│gica de negocio, no hab├¡a capa de DTOs y las
entidades viajaban directo a la vista. Funcion├│, pero no era demostrable como dise├▒o ni testeable por
capas. Esa experiencia es el antecedente directo de la decisi├│n de adoptar **Arquitectura Limpia** con
puertos y adaptadores en este proyecto (`docs/design-decisions.md`, ADR-001), con el dominio aislado
del framework y verificado por un test de ArchUnit en la build (`ADR-002`).

**Antecedente metodol├│gico de datos.** El plan inicial del equipo afirmaba que el `robots.txt` de
Acuacar prohib├¡a el acceso automatizado, sin haberlo verificado. Al auditar la fuente con peticiones
reales se descubri├│ que la afirmaci├│n era falsa y que Acuacar expone una **API REST p├║blica y
estable** (WordPress, 307 boletines hist├│ricos, paginada y con filtros por fecha) (`ADR-004`). Ese
error corregido ΓÇöverificar antes de afirmarΓÇö se conserva como lecci├│n del proceso y va en las
conclusiones del informe (`ADR-004`; `MEMORY.md`).

---

## 2. Marco te├│rico

### 2.1 Arquitectura Limpia y el principio de dependencias hacia adentro

El proyecto adopta la Arquitectura Limpia en sus cuatro capas ΓÇö`domain`, `application`,
`infrastructure`, `api`ΓÇö con las dependencias apuntando siempre hacia adentro (`ADR-001`). El dominio
es Java puro: **si importa algo que empiece por `org.springframework` o `com.mongodb`, la arquitectura
est├í rota**, y un test de ArchUnit lo verifica en cada build (`CLAUDE.md` ┬º Arquitectura; `ADR-002`).

Las consecuencias de esta decisi├│n son directas para el proceso acad├⌐mico: el dominio se prueba sin
levantar Spring, cada principio de SOLID tiene un lugar concreto que se├▒alar en la sustentaci├│n, y la
capa de infraestructura puede reemplazarse sin tocar las reglas de negocio (`ADR-001`). El costo es
m├ís ceremonia estructural ΓÇö un caso de uso simple toca varios archivos ΓÇö, aceptado deliberadamente
frente a la alternativa de un MVC en capas como el del proyecto previo (`ADR-001`).

### 2.2 Patrones de dise├▒o aplicados (evidencia SOLID)

El dominio aplica cuatro patrones documentados en el modelo de dominio, cada uno atado a un requisito
y a un sprint (`docs/ingenieria/modelo-de-dominio.md` ┬º3):

| Patr├│n | D├│nde se aplica | Requisito |
|---|---|---|
| **Strategy** | `EstrategiaConsenso`: umbral fijo y umbral proporcional a la poblaci├│n | RF010 |
| **Builder** | Construcci├│n de `CorteAgua` (impide horas fin anteriores al inicio) | RF016 |
| **Factory Method** | Creaci├│n de `EventoBitacora`, ├║nica v├¡a de anexar a la bit├ícora | RF026 |
| **Specification** *(pendiente)* | Filtros de estad├¡sticas del m├│dulo M7 | Sprint 4 |

La elecci├│n no es ornamental: el patr├│n Strategy de consenso hace intercambiable el criterio de
confirmaci├│n sin tocar los dem├ís casos de uso, y el resto de la operaci├│n ΓÇöla suscripci├│n con doble
opt-in y la baja en un clic (RF013, RF015)ΓÇö se apoya directamente en la Ley 1581 de 2012
(`docs/product-requirements.md`).

### 2.3 Los dos motores de datos: MongoDB y Redis

La persistencia principal vive en **MongoDB** con ├¡ndices geoespaciales (`2dsphere`) sobre el GeoJSON,
y el estado ef├¡mero de alta frecuencia vive en **Redis** (cach├⌐, rate limiting, ventana deslizante de
consenso y pub/sub) (`ADR-003`). La justificaci├│n t├⌐cnica viene de que los cortes son documentos de
estructura variable y de que el producto necesita responder *a qu├⌐ sector pertenece una coordenada* y
contar reportes recientes en ventanas de tiempo (`ADR-003`). La arquitectura por puertos y adaptadores
permite reemplazar cualquiera de los dos sin tocar el dominio (`ADR-003`).

### 2.4 Inteligencia artificial aplicada a la extracci├│n estructurada

La ingesta de avisos oficiales usa un **pipeline en cinco etapas** que termina en extracci├│n con un
modelo de lenguaje, con salida estructurada obligatoria y puntaje de confianza (`docs/ingenieria/
pipeline-ingesta-datos.md`). Tres ideas defienden la capa de IA:

- **Cita textual verificable.** Toda extracci├│n incluye la frase exacta del bolet├¡n que la sustenta; si
  `documento.texto().contains(cita)` es falso, la extracci├│n se rechaza autom├íticamente (`ADR-006`).
  Un corte inventado destruir├¡a la credibilidad ΓÇö la anti-alucinaci├│n es comprobaci├│n de c├│digo, no una
  promesa.
- **Enrutamiento por confianza.** Confianza ΓëÑ 0.85 publica; 0.5ΓÇô0.85 va a revisi├│n humana en el panel del
  veedor; < 0.5 se archiva (`ADR-006`; `pipeline-ingesta-datos.md` ┬º3). El borde est├í orientado a la
  precisi├│n: un falso negativo lo reporta la comunidad (capa L4); un falso positivo nadie lo corrige.
- **M├⌐tricas medibles.** Un conjunto dorado de boletines hist├│ricos etiquetados a mano corre en CI; si un
  cambio de prompt baja la precisi├│n o el F1, la build falla (`pipeline-ingesta-datos.md` ┬º4).

La ├⌐tica de datos es parte del marco te├│rico: se respeta el `robots.txt` de cada medio aunque un
colector propio pudiera evitarlo, y la cobertura de quienes bloquean a los agentes de IA llega de forma
indirecta v├¡a Google News RSS (`ADR-005`). El colector se identifica siempre con un `User-Agent` que
nombre el proyecto, y hace peticiones condicionales y espaciadas (1 cada 30 s) (`pipeline-ingesta-datos.md`
┬º6).

## 3. Marco conceptual

- **Acueducto / interrupci├│n del servicio.** Falta de continuidad en el suministro por suspensi├│n
  programada, emergencia, aver├¡a o racionamiento. El sistema trabaja sobre el aviso ΓÇö no sobre la obra ΓÇö
  y por tanto solo requiere el texto p├║blico del operador (`docs/brief.md` ┬º Qu├⌐ NO es).
- **Sector.** Unidad geogr├ífica m├¡nima con estado propio (con servicio, sin servicio, presi├│n baja,
  corte programado). 211 sectores de Cartagena definidos por el GeoJSON de barrios de Cartagena C├│mo
  Vamos (213 pol├¡gonos; 184 con poblaci├│n censal DANE 2018 + CORVIVIENDA) (`MEMORY.md`;
  `data/geoespacial/README.md`).
- **EstadoServicio.** Enum con cuatro valores que colorea el mapa; el ┬½sin dato┬╗ se resuelve en la
  presentaci├│n, no en el dominio (`docs/ingenieria/modelo-de-dominio.md` ┬º1).
- **Reporte ciudadano.** Aviso del vecino ΓÇösin registroΓÇö de que no hay agua, hay presi├│n baja o ya
  volvi├│ el servicio, con georreferenciaci├│n opcional (RF005ΓÇôRF007).
- **Consenso autom├ítico.** Cambio de estado de un sector tras N reportes independientes coincidentes
  en una ventana de tiempo configurable; cada cambio preserva qu├⌐ reportes lo sustentaron (RF009ΓÇôRF011).
- **├ìndice de Cumplimiento.** Diferencia entre la duraci├│n prometida de un corte y la real; vive en el
  cruce de la capa oficial (L1, lo anunciado) y la capa ciudadana (L4, lo ocurrido)
  (`docs/brief.md`; `pipeline-ingesta-datos.md` ┬º2).
- **Doble opt-in.** Confirmaci├│n por correo antes de enviar alertas; la baja es de un clic
  (RF012ΓÇôRF015, Ley 1581/2012).
- **Huella de dispositivo.** Identificador hash no reversible a identidad, sustituto del registro
  para el rate limiting sin recolectar datos personales (`ADR-007`;
  `docs/ingenieria/modelo-de-dominio.md` ┬º1).

## 4. Marco legal

- **Ley 1581 de 2012 (protecci├│n de datos personales).** Funda el doble opt-in de la suscripci├│n y la
  baja en un clic (regulada en RF013 y RF015, origen ┬½Ley 1581/2012┬╗); el sistema no recolecta m├ís que
  un correo para alertas (`docs/product-requirements.md`).
- **Ley 142 de 1994 (servicios p├║blicos domiciliarios).** Marco general de la prestaci├│n del servicio
  de acueducto y de la obligaci├│n del prestador de informar; referencia de contexto para la continuidad
  y el deber del operador (introducida en `docs/equipo/D1-notificaciones-bitacora.md` para el Cap├¡tulo II).
- **Medidas cautelares del Tribunal Administrativo de Bol├¡var (junio 2026).** Ordenan socializar
  previamente cada interrupci├│n con tiempos exactos y condiciones; son el hecho que fundamenta el
  proyecto y el origen del requisito de registrar cortes oficiales (`MEMORY.md`; RF016ΓÇôRF017).
- **Comisi├│n de Regulaci├│n de Agua Potable (CRA).** Verificada accesible (HTTP 200); su normativa
  de continuidad del servicio es material de referencia humana del marco legal, no fuente de datos
  operativos en tiempo real (`docs/ingenieria/auditoria-fuentes-de-datos.md` ┬º5).
- **Superintendencia de Servicios P├║blicos / SUI.** Bloqueada program├íticamente por Incapula/Imperva;
  sus indicadores oficiales de continuidad se usan ├║nicamente como referencia humana del marco legal,
  nunca como fuente automatizada (`docs/ingenieria/auditoria-fuentes-de-datos.md` ┬º5).

---

## 5. Referencias del cap├¡tulo

Fuentes internas del repositorio que sustentan las afirmaciones anteriores:

- `docs/brief.md` ΓÇö problema, antecedente, qui├⌐n es el usuario, el ├ìndice de Cumplimiento.
- `MEMORY.md` ΓÇö contexto citable (15 %, planta El Bosque, fallo del Tribunal, restricciones de fuentes).
- `docs/design-decisions.md` ΓÇö ADR-001, ADR-002, ADR-003, ADR-004, ADR-005, ADR-006, ADR-007.
- `docs/ingenieria/modelo-de-dominio.md` ΓÇö entidades, patrones y puertos del dominio.
- `docs/ingenieria/pipeline-ingesta-datos.md` ΓÇö pipeline de cinco etapas, capas de datos y capa de IA.
- `docs/ingenieria/auditoria-fuentes-de-datos.md` ΓÇö verificaci├│n de cada fuente y regulaci├│n estatal (┬º5).
- `docs/product-requirements.md` ΓÇö requisitos con su origen legal (RF013, RF015).
- `CLAUDE.md` ΓÇö arquitectura, ├⌐tica de datos y formato acad├⌐mico.

> Las referencias externas (normas, jurisprudencia, art├¡culos) en formato APA-7 se consolidar├ín en
> `referencias.md` una vez validada la plantilla; ninguna cita externa se a├▒adir├í sin verificar.
