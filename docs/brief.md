# Brief — AguaVigía CTG

> Documento de visión. Responde qué construimos, para quién y por qué. Si una funcionalidad no
> encaja en este brief, no entra al producto.

---

## El problema en una frase

**El usuario del acueducto en Cartagena no dispone de información oportuna, verificable ni trazable
sobre las interrupciones del servicio.**

---

## Por qué existe este problema

Cartagena vive desde 2023 fallas recurrentes de continuidad en el acueducto operado por Acuacar
(concesión con Veolia vigente hasta 2034). Entre mayo y julio de 2026 los racionamientos sectorizados
afectaron hasta al **15% de la población**; la planta El Bosque, que abastece cerca del **90%** del
agua potable de la ciudad, redujo su capacidad por proliferación de algas.

Pero hay **dos crisis, no una**:

| | Falla técnica | Falla de información |
|---|---|---|
| Qué es | La infraestructura no entrega agua | El vecino no sabe qué está pasando |
| Quién la resuelve | El operador, con inversión en obra | **Software** |
| ¿Está en nuestro alcance? | No | **Sí** |

En junio de 2026 el **Tribunal Administrativo de Bolívar** dictó medidas cautelares ordenando al
operador *socializar previamente* cada interrupción, detallando tiempos exactos y condiciones. Que un
juez deba ordenar lo que una empresa de servicios públicos debería hacer por defecto confirma que la
falta de aviso no era percepción ciudadana: era un incumplimiento verificable.

**Ese es el hecho que fundamenta el proyecto.**

---

## Qué construimos

Una plataforma web ciudadana que:

1. **Centraliza** los avisos oficiales del operador (que hoy se dispersan entre su web, la prensa y
   grupos de WhatsApp).
2. **Verifica** esos avisos contra reportes de vecinos en tiempo real.
3. **Mide y publica** la brecha entre la duración prometida de cada corte y la real — el
   **Índice de Cumplimiento**.
4. **Avisa** por correo al vecino de un sector cuando algo cambia.

---

## Para quién

### Vecino de barrio popular — usuario principal
Sin agua desde temprano. Necesita saber si comprar botellones o esperar. Entra desde el celular, con
datos móviles limitados. **No va a registrarse.** Si el producto le pide crear una cuenta, lo pierde.

### Comerciante / hotelero
Un corte sin aviso le cuesta dinero: no puede abrir, pierde reservas. Necesita anticipación, no
explicación.

### Veedor ciudadano / líder comunal
Quiere evidencia acumulada para exigir. Necesita histórico exportable y trazabilidad, no una foto del
momento.

### Periodista
Busca datos verificables para sustentar una nota. Necesita citar una fuente que no sea "dicen los
vecinos".

---

## Qué lo hace distinto

Ya existen la web del operador, la prensa y los grupos de WhatsApp. Ninguno hace esto:

| | Web del operador | Grupos de WhatsApp | **AguaVigía** |
|---|---|---|---|
| Avisos oficiales | ✅ | ⚠️ de oídas | ✅ |
| Confirmación de vecinos | ❌ | ✅ pero sin estructura | ✅ georreferenciada |
| Histórico consultable | ❌ | ❌ | ✅ |
| **Mide si se cumplió lo prometido** | ❌ | ❌ | ✅ **único** |

**El Índice de Cumplimiento es el diferencial.** Nadie más publica si el operador cumplió el horario
que anunció, porque nadie más está registrando ambos datos a la vez.

---

## El insight central

> **El aviso oficial dice lo que se prometió. El reporte del vecino dice lo que realmente pasó.
> El valor del producto vive en la diferencia entre los dos.**

De ahí sale todo: por qué necesitamos ambas fuentes, por qué el reporte ciudadano no puede tener
fricción, y por qué el Índice de Cumplimiento es el corazón y no un extra.

---

## Los 9 módulos

| # | Módulo | Qué resuelve |
|---|---|---|
| M1 | Mapa en vivo | Ver el estado de la ciudad de un vistazo |
| M2 | Reporte ciudadano | Que el vecino informe sin registrarse |
| M3 | Consenso automático | Que varios reportes coincidentes cambien el estado solos |
| M4 | Alertas por correo | Que te avisen a ti, de tu sector |
| M5 | Panel del veedor | Cargar y moderar la información oficial |
| M6 | **Índice de Cumplimiento** | **Medir lo prometido contra lo cumplido** |
| M7 | Estadísticas | Entender el patrón, no solo el evento |
| M8 | Bitácora pública | Dejar constancia inmutable |
| M9 | Ingesta automática con IA | Que nadie tenga que copiar y pegar boletines |

---

## Qué NO es

Restricciones deliberadas. Si algo de esta lista se propone, se rechaza citando este documento.

- **No repara el suministro.** Interviene sobre la información, no sobre la infraestructura.
- **No es una red social.** Sin perfiles, sin likes, sin comentarios, sin gamificación.
- **No sustituye la línea de atención del operador.** No es un canal de emergencias.
- **No recolecta datos personales.** Reportar no requiere cuenta; suscribirse solo pide un correo,
  con baja en un clic.
- **No scrapea redes sociales ni medios que lo prohíban.** Ver la política en `CLAUDE.md`.
- **No es una app móvil nativa.** Web responsive y PWA.

---

## Cómo sabremos si funcionó

| Indicador | Meta |
|---|---|
| Un vecino responde "¿tengo agua?" sin leer ni registrarse | < 5 segundos |
| Reportes ciudadanos necesarios para confirmar un corte por consenso | 3, en ventana de 30 min |
| Precisión del clasificador de IA sobre el conjunto dorado | ≥ 90% |
| Cortes con Índice de Cumplimiento calculado | 100% de los que tengan hora prometida |
| Satisfacción de usuarios (instrumento, Alfa de Cronbach) | ≥ 4.0 / 5.0, α ≥ 0.75 |

---

## Contexto académico

Proyecto de aula — Fundación Universitaria Tecnológico Comfenalco, Tecnología en Desarrollo de
Software. 5 integrantes, 6 meses, Scrum. Investigación **proyectiva** con **enfoque mixto**.

El producto debe funcionar de verdad **y** el proceso debe quedar documentado según la plantilla
institucional (4 capítulos + 6 anexos + APA 7).
