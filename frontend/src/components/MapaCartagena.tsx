/**
 * MapaCartagena — componente principal del mapa (M1).
 *
 * Sprint 1: carga el GeoJSON de barrios desde /data/geoespacial/barrios-cartagena.geojson
 * (datos reales de D5) y colorea los polígonos según su estado.
 *
 * C2 ya está abierta: el estado de cada sector viene de GET /api/sectores (vía
 * useDatosEnVivo), no de datos locales. Los tipos y colores son definitivos.
 *
 * Leaflet requiere que su CSS se importe antes de crear el mapa.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import type { FC } from 'react'
// (No se requiere Link aquí)
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Locate, Minus, Plus } from 'lucide-react'
import type { EstadoServicio, Sector } from '../types/tipos-dominio'
import { COLOR_POR_ESTADO, COLOR_SIN_DATOS } from '../types/tipos-dominio'
import { EtiquetaFrescura } from './EtiquetaFrescura'
import { obtenerGeoJSONBarrios } from '../data/barriosCartagena'
import { volarABounds } from '../utils/mapaLeaflet'

// Cartagena de Indias — centro urbano equilibrado y zoom inicial
const CENTRO: L.LatLngExpression = [10.4120, -75.5150]
const ZOOM_INICIAL = 12.5
const BOUNDS_CARTAGENA: L.LatLngBoundsExpression = [
  [10.25, -75.65], // Suroeste
  [10.53, -75.40]  // Noreste
]

interface Props {
  sectores: Sector[]
  cargando: boolean
  ultimaActualizacion: string | null
  /** F4 — false mientras el stream SSE en vivo está caído (ver useDatosEnVivo). */
  conexionViva?: boolean
  sectorActivo: Sector | null
  /** Estado destacado desde las tarjetas de resumen (ver TarjetasEstadoMapa) — resalta,
   *  atenúa el resto, encuadra el zoom y dibuja pings + línea entre esos barrios. */
  estadoDestacado: EstadoServicio | null
  onSectorSeleccionado?: (sector: Sector | null) => void
}

/** Convierte el NOMBRE del GeoJSON al id del sector para hacer lookup */
function normalizarNombre(nombre: string): string {
  return nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
}

/**
 * `L.Map.flyToBounds` no valida su argumento: si `bounds` viene con alg\u00fan NaN, Leaflet lanza
 * "Invalid LatLng object: (NaN, NaN)" desde dentro de la animaci\u00f3n, fuera de cualquier
 * try/catch nuestro \u2014 React lo capta como error de render y tumba toda la vista (bug real,
 * visto seleccionando un barrio desde el buscador; no se logr\u00f3 aislar una causa
 * determin\u00edstica, probablemente una carrera puntual con el layout). `isValid()` es la propia
 * comprobaci\u00f3n que Leaflet usa internamente antes de operar con un `LatLngBounds`; hacerla
 * antes de llamar a `flyToBounds` convierte un crash de toda la p\u00e1gina en, como mucho, un
 * "no se movi\u00f3 el mapa esta vez".
 */
/** Estilo de un polígono — compartido entre la carga inicial y la actualización reactiva
 *  para que ambos caminos nunca diverjan en cómo se ve un barrio. */
function calcularEstiloFeature(
  sector: Sector | undefined,
  sectorActivo: Sector | null,
  estadoDestacado: EstadoServicio | null
): L.PathOptions {
  const estado = sector?.estado
  // ADR-035: sin corte anunciado por Acuacar ni reporte vigente, el barrio se muestra con servicio.
  // Vale también para el resaltado: si no lo tratáramos como CON_SERVICIO aquí, filtrar por "Con
  // servicio" atenuaría justo a los barrios que la regla considera con agua.
  const estadoEfectivo: EstadoServicio | undefined = sector ? (estado ?? 'CON_SERVICIO') : undefined
  const color = estado ? COLOR_POR_ESTADO[estado].claro : COLOR_SIN_DATOS.claro
  const esActivo = !!(sectorActivo && sector && sectorActivo.id === sector.id)
  const enFoco = estadoDestacado !== null
  const esDestacado = !!(estadoEfectivo && estadoEfectivo === estadoDestacado)
  const atenuado = enFoco && !esDestacado

  return {
    fillColor: color,
    fillOpacity: !sector ? 0.15 : atenuado ? 0.08 : esDestacado ? 0.8 : esActivo ? 0.85 : 0.55,
    color: esDestacado ? color : '#ffffff',
    weight: esDestacado ? 3 : esActivo ? 2 : 1,
    opacity: atenuado ? 0.18 : esActivo || esDestacado ? 1 : 0.7,
    className: esDestacado ? `barrio-destacado barrio-destacado-${estadoEfectivo}` : esActivo ? 'barrio-seleccionado' : '',
  }
}

export const MapaCartagena: FC<Props> = ({
  sectores,
  cargando,
  ultimaActualizacion,
  conexionViva = true,
  sectorActivo,
  estadoDestacado,
  onSectorSeleccionado,
}) => {
  const contenedorRef = useRef<HTMLDivElement>(null)
  const mapaRef = useRef<L.Map | null>(null)
  const capaRef = useRef<L.GeoJSON | null>(null)
  const capaBaseRef = useRef<L.TileLayer | null>(null)
  const destacadoLayerRef = useRef<L.LayerGroup | null>(null)

  // Nivel de zoom actual, solo para apagar el botón que ya no puede hacer nada.
  const [zoom, setZoom] = useState(ZOOM_INICIAL)

  // Aviso del gesto: en táctil el mapa arranca sordo al arrastre de un dedo, porque ese mismo
  // gesto es el que desplaza la página, y hay que decir cómo soltarlo. El bloqueo en sí no
  // vive en el estado de React sino en una clase del contenedor (ver el efecto más abajo).
  const [aviso, setAviso] = useState<'oculto' | 'pista' | 'libre'>('oculto')

  // Índice de sectores por nombre normalizado para lookup O(1)
  const indiceSectores = useRef<Map<string, Sector>>(new Map())
  useEffect(() => {
    const mapa = new Map<string, Sector>()
    sectores.forEach(s => mapa.set(normalizarNombre(s.nombre), s))
    indiceSectores.current = mapa
  }, [sectores])

  // Ref para tener siempre el último valor en cierres (closures) asíncronos
  const sectorActivoRef = useRef(sectorActivo)
  useEffect(() => {
    sectorActivoRef.current = sectorActivo
  }, [sectorActivo])

  // Distinto del ref de arriba: este existe solo para distinguir "recién cerré el detalle
  // de un sector" (había sectorActivo, ahora no) de "todavía no elegí ninguno" (nunca lo
  // hubo) — el efecto de abajo solo debe volar a la vista por defecto en el primer caso, no
  // en cada montaje de la página.
  const sectorActivoAnteriorRef = useRef<Sector | null>(null)

  const estadoDestacadoRef = useRef(estadoDestacado)
  useEffect(() => {
    estadoDestacadoRef.current = estadoDestacado
  }, [estadoDestacado])

  // Actualizar estilos dinámicamente cuando el usuario selecciona un barrio o destaca un estado
  useEffect(() => {
    if (!capaRef.current) return

    capaRef.current.setStyle((feature) => {
      const nombre = feature?.properties?.NOMBRE ?? ''
      const sector = indiceSectores.current.get(normalizarNombre(nombre))
      return calcularEstiloFeature(sector, sectorActivo, estadoDestacado)
    })

    // Centrar automáticamente el mapa en el polígono del barrio seleccionado. Se compara por
    // NOMBRE normalizado, no por sector.id: muchos barrios del GeoJSON no tienen sector en la
    // BD (ver el "sectorClick" sintético que arma onEachFeature) y por id nunca calzarían — el
    // mapa se quedaba sin hacer zoom en esos barrios.
    if (sectorActivo) {
      const nombreActivoNorm = normalizarNombre(sectorActivo.nombre)
      capaRef.current.eachLayer((layer: any) => {
        const nombre = layer.feature?.properties?.NOMBRE ?? ''
        if (normalizarNombre(nombre) !== nombreActivoNorm || !mapaRef.current) return
        volarABounds(mapaRef.current, layer.getBounds(), { padding: [20, 20], duration: 1.5 })
      })
    } else if (sectorActivoAnteriorRef.current) {
      // Se acaba de CERRAR la ficha de un sector (había uno activo, ahora no) — vuelve a la
      // vista por defecto, igual que el botón "centrar mapa". Sin este `else if` disparado
      // solo en la transición, cualquier otro cambio de sectores/estadoDestacado con el mapa
      // ya en la vista general lo volvería a sobrevolar hasta ahí sin que nadie lo pidiera.
      mapaRef.current?.flyTo(CENTRO, ZOOM_INICIAL, { duration: 1.2 })
    }
    sectorActivoAnteriorRef.current = sectorActivo
  }, [sectorActivo, estadoDestacado, sectores])

  // Dibuja (o limpia) el foco de "Ver en el mapa": atenúa el resto vía calcularEstiloFeature
  // (efecto de arriba) y acá arma el encuadre + la línea + los "pings" con el nombre de cada
  // barrio del estado destacado. Vive en un ref porque se llama desde dos sitios — el efecto
  // que reacciona a estadoDestacado, y el .then() de la carga del GeoJSON (si el usuario ya
  // había elegido una tarjeta antes de que el mapa terminara de cargar) — y ambos deben ver
  // siempre el valor más reciente sin quedar atados a las dependencias de un useEffect.
  const dibujarDestacado = useCallback(() => {
    const mapa = mapaRef.current
    const capa = capaRef.current
    const estado = estadoDestacadoRef.current

    if (destacadoLayerRef.current) {
      destacadoLayerRef.current.remove()
      destacadoLayerRef.current = null
    }

    if (!mapa) return

    if (!estado || !capa) {
      mapa.flyTo(CENTRO, ZOOM_INICIAL, { duration: 1.2 })
      return
    }

    const limites = L.latLngBounds([])
    let barriosEncontrados = 0

    capa.eachLayer((layer: any) => {
      const nombre = layer.feature?.properties?.NOMBRE ?? ''
      const sector = indiceSectores.current.get(normalizarNombre(nombre))
      if (sector?.estado !== estado) return
      const bounds = layer.getBounds ? layer.getBounds() : null
      if (!bounds || !bounds.isValid()) return
      const centro = typeof layer.getCenter === 'function' ? layer.getCenter() : bounds.getCenter()
      if (!Number.isFinite(centro.lat) || !Number.isFinite(centro.lng)) return

      // Filtrar estrictamente para el área urbana de Cartagena (descartando islas remotas como Isla Fuerte o zonas industriales)
      if (centro.lat >= 10.365 && centro.lat <= 10.465 && centro.lng >= -75.565 && centro.lng <= -75.440) {
        limites.extend(bounds)
        barriosEncontrados++
      }
    })

    if (barriosEncontrados === 0 || !limites.isValid()) {
      mapa.flyTo(CENTRO, ZOOM_INICIAL, { duration: 1.2 })
      return
    }

    // Centrar con encuadre limpio en el mapa urbano sin saturar con etiquetas ni líneas
    volarABounds(mapa, limites, { padding: [45, 45], duration: 1.2, maxZoom: 14 })
  }, [])

  useEffect(() => {
    dibujarDestacado()
  }, [estadoDestacado, dibujarDestacado])

  // Inicializar el mapa una sola vez
  useEffect(() => {
    if (!contenedorRef.current || mapaRef.current) return

    const mapa = L.map(contenedorRef.current, {
      center: CENTRO,
      zoom: ZOOM_INICIAL,
      minZoom: 12,
      maxBounds: BOUNDS_CARTAGENA,
      maxBoundsViscosity: 1.0,
      zoomControl: false,
      attributionControl: false,
      preferCanvas: true, // Renderizar capas vectoriales en Canvas HTML5 para 60fps fluidos en móviles
    })

    mapa.on('zoomend', () => setZoom(mapa.getZoom()))

    L.control.attribution({ position: 'bottomleft', prefix: false }).addTo(mapa)

    // La capa base cambia entre claro/oscuro según el tema activo, para que el mapa nunca
    // desentone con el resto de la interfaz (ver SelectorTema / useTheme).
    const mediaOscura = window.matchMedia('(prefers-color-scheme: dark)')
    const usarMapaOscuro = () => document.documentElement.dataset.theme === 'dark'
      || (!document.documentElement.dataset.theme && mediaOscura.matches)
    const actualizarCapaBase = () => {
      capaBaseRef.current?.remove()
      const oscuro = usarMapaOscuro()
      // Esri y no CARTO en el tema oscuro: `basemaps.cartocdn.com` pasó a exigir clave y hoy
      // devuelve teselas con la marca de agua "API KEY REQUIRED" estampada sobre el mapa
      // (verificado el 2026-08-30: la tesela responde 200 con la marca, no un 401). El canvas
      // gris oscuro de Esri no pide clave y su atribución exige nombrar también a HERE y Garmin.
      capaBaseRef.current = L.tileLayer(
        oscuro
          ? 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'
          : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          attribution: oscuro
            ? '© <a href="https://www.esri.com">Esri</a>, HERE, Garmin, © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            : '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        },
      ).addTo(mapa)
    }
    actualizarCapaBase()

    const observarTema = new MutationObserver(actualizarCapaBase)
    observarTema.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    mediaOscura.addEventListener('change', actualizarCapaBase)

    mapaRef.current = mapa
    return () => {
      observarTema.disconnect()
      mediaOscura.removeEventListener('change', actualizarCapaBase)
      mapa.remove()
      mapaRef.current = null
      capaBaseRef.current = null
    }
  }, [])

  // Leaflet mide su contenedor una sola vez al crearse y después cachea ese tamaño —
  // cualquier resize que no pase por su propia API (como el ancho de .mapa-lienzo-completo
  // animando al colapsar la columna, ver PaginaMapa) lo deja creyendo que el contenedor
  // sigue midiendo lo de antes. El síntoma es un mapa que centra y hace zoom al lugar
  // correcto pero se ve recortado o desplazado, porque calcula la posición en pantalla con
  // el tamaño viejo. invalidateSize() le hace recalcular sus medidas reales; el
  // ResizeObserver lo dispara automáticamente cada vez que el contenedor cambia, sin que
  // este componente necesite saber POR QUÉ cambió (colapsar la columna, redimensionar la
  // ventana, cualquier causa futura).
  //
  // Va agrupado en un requestAnimationFrame y con `pan: false`. El observador dispara en
  // CADA cuadro mientras el marco se anima al colapsar la columna, e invalidateSize recoloca
  // todas las capas y pide teselas nuevas: llamarlo treinta veces seguidas hundía la
  // animación a ~12 cuadros por segundo, que es lo que se percibía como un salto brusco y no
  // como una transición. Con el agrupado se hace como mucho una vez por cuadro pintado, y
  // `pan: false` le ahorra además recentrar la vista en cada una — el centro no cambia,
  // cambia el tamaño. Al asentarse se repite una última vez con las opciones completas para
  // quedar con la medida definitiva.
  useEffect(() => {
    const contenedor = contenedorRef.current
    if (!contenedor) return

    let cuadro = 0
    let reposo: ReturnType<typeof setTimeout> | undefined

    const ro = new ResizeObserver(() => {
      if (!cuadro) {
        cuadro = requestAnimationFrame(() => {
          cuadro = 0
          mapaRef.current?.invalidateSize({ pan: false })
        })
      }
      clearTimeout(reposo)
      reposo = setTimeout(() => mapaRef.current?.invalidateSize(), 160)
    })
    ro.observe(contenedor)
    return () => {
      ro.disconnect()
      if (cuadro) cancelAnimationFrame(cuadro)
      clearTimeout(reposo)
    }
  }, [])

  // Arrastre de un dedo: bloqueado hasta que se mantiene pulsado.
  //
  // El mapa ocupa el alto del hero, así que en teléfono el mismo gesto que lo panea es el que
  // desplaza la página, y ganaba siempre el mapa: Leaflet pone `touch-action: none` en su
  // contenedor y el dedo se quedaba atrapado moviendo Cartagena en vez de bajar a la Bitácora.
  //
  // No se desactiva `map.dragging`: se dejan pasar los `touchstart` —para que Leaflet apunte
  // el punto de partida— y se detienen los `touchmove` en fase de CAPTURA, antes de que
  // lleguen al listener que Leaflet tiene puesto en `document`. Así, cuando el temporizador
  // suelta el bloqueo a mitad del gesto, el arrastre arranca desde el punto original y sin
  // salto, en vez de exigir levantar el dedo y volver a empezar.
  //
  // El desplazamiento de la página se corta con `preventDefault`, no con `touch-action`: el
  // navegador fija el touch-action al EMPEZAR el gesto y no vuelve a mirarlo, así que
  // cambiar la clase a mitad de una pulsación larga no lo desharía — la página se seguiría
  // desplazando durante todo ese gesto. Por eso el listener es no pasivo. La clase sigue
  // existiendo para los gestos SIGUIENTES, que sí arrancan ya desbloqueados.
  //
  // Con dos dedos no se interviene: el pellizco para hacer zoom no compite con nada.
  useEffect(() => {
    const contenedor = contenedorRef.current
    if (!contenedor) return
    if (!window.matchMedia('(pointer: coarse)').matches) return

    const RETENCION_MS = 400
    const TOLERANCIA_PX = 12
    const GRACIA_MS = 1600

    // classList y no la prop `className` del JSX: Leaflet agrega las suyas al mismo nodo
    // (leaflet-container, leaflet-grab, leaflet-touch-drag...) y React, al re-renderizar,
    // reescribe el atributo entero y se las lleva por delante — con ellas se iba el fondo,
    // el cursor y el propio touch-action que esto quiere ajustar.
    const marcarBloqueo = (bloqueado: boolean) =>
      contenedor.classList.toggle('mapa-gesto-bloqueado', bloqueado)
    marcarBloqueo(true)

    let libre = false
    let retencion: ReturnType<typeof setTimeout> | undefined
    let recaida: ReturnType<typeof setTimeout> | undefined
    let ocultarAviso: ReturnType<typeof setTimeout> | undefined
    let inicio: { x: number; y: number } | null = null

    const alTocar = (e: TouchEvent) => {
      clearTimeout(recaida)
      if (e.touches.length !== 1) return
      inicio = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      if (!libre) {
        setAviso('pista')
        clearTimeout(ocultarAviso)
        ocultarAviso = setTimeout(() => setAviso('oculto'), 2600)
      }
      clearTimeout(retencion)
      retencion = setTimeout(() => {
        libre = true
        marcarBloqueo(false)
        setAviso('libre')
        clearTimeout(ocultarAviso)
        ocultarAviso = setTimeout(() => setAviso('oculto'), 1800)
        navigator.vibrate?.(12)
      }, RETENCION_MS)
    }

    const alMover = (e: TouchEvent) => {
      if (e.touches.length > 1) return
      if (libre) {
        // Ya desbloqueado: el mapa se queda con el gesto y la página no se mueve.
        if (e.cancelable) e.preventDefault()
        return
      }
      if (inicio) {
        const d = Math.hypot(e.touches[0].clientX - inicio.x, e.touches[0].clientY - inicio.y)
        // Se movió antes de tiempo: está desplazando la página, no queriendo mover el mapa.
        if (d > TOLERANCIA_PX) clearTimeout(retencion)
      }
      e.stopPropagation()
    }

    const alSoltar = () => {
      clearTimeout(retencion)
      inicio = null
      if (!libre) return
      // Un margen tras levantar el dedo: encadenar dos arrastres no debería costar dos
      // pulsaciones largas.
      clearTimeout(recaida)
      recaida = setTimeout(() => {
        libre = false
        marcarBloqueo(true)
      }, GRACIA_MS)
    }

    const pasivo = { capture: true, passive: true } as const
    // El de `touchmove` NO puede ser pasivo: es el único que llama a preventDefault.
    const activo = { capture: true, passive: false } as const
    contenedor.addEventListener('touchstart', alTocar, pasivo)
    contenedor.addEventListener('touchmove', alMover, activo)
    contenedor.addEventListener('touchend', alSoltar, pasivo)
    contenedor.addEventListener('touchcancel', alSoltar, pasivo)

    return () => {
      contenedor.removeEventListener('touchstart', alTocar, pasivo)
      contenedor.removeEventListener('touchmove', alMover, activo)
      contenedor.removeEventListener('touchend', alSoltar, pasivo)
      contenedor.removeEventListener('touchcancel', alSoltar, pasivo)
      clearTimeout(retencion)
      clearTimeout(recaida)
      clearTimeout(ocultarAviso)
      marcarBloqueo(false)
    }
  }, [])

  // Cargar GeoJSON y colorear polígonos
  useEffect(() => {
    const mapa = mapaRef.current
    if (!mapa) return

    let montado = true;

    if (capaRef.current) { capaRef.current.remove(); capaRef.current = null }

    obtenerGeoJSONBarrios()
      .then((geojson) => {
        if (!montado) return;
        const capa = L.geoJSON(geojson, {
          style: (feature) => {
            const nombre = feature?.properties?.NOMBRE ?? ''
            const sector = indiceSectores.current.get(normalizarNombre(nombre))
            return calcularEstiloFeature(sector, sectorActivoRef.current, estadoDestacadoRef.current)
          },
          onEachFeature: (feature, layer) => {
            const nombre = feature?.properties?.NOMBRE ?? 'Sector desconocido'
            const sector = indiceSectores.current.get(normalizarNombre(nombre))

            // Sin tooltip de hover a propósito: con el mapa animando (flyToBounds de
            // dibujarDestacado) el cursor queda "sobrevolando" muchos polígonos que se
            // mueven debajo sin un mouseout real entre ellos, y Leaflet se quedaba con
            // varios tooltips pegados a la vez ("spam"). El detalle ahora es solo por click
            // — el sector seleccionado se muestra en PanelDetalleSector, en el panel lateral.
            layer.on('click', () => {
              // Un barrio del GeoJSON que el backend no conoce se muestra SIN DATO, no con agua.
              // Antes se fabricaba aquí como CON_SERVICIO y con `actualizadoEn: new Date()`, así
              // que el panel afirmaba «servicio normal, actualizado en este momento» sobre un
              // barrio del que no se sabía absolutamente nada. Es el falso positivo que ADR-014
              // prohíbe y la razón por la que `estado` es nulable en el contrato.
              const sectorClick: Sector = sector ?? {
                id: `geo-${normalizarNombre(nombre)}`,
                nombre,
                estado: null,
                actualizadoEn: null,
              }

              onSectorSeleccionado?.(sectorClick)
            })

            layer.on('mouseover', (e) => {
              const l = e.target as L.Path
              l.setStyle({ weight: 2, fillOpacity: 0.75 })
            })
            layer.on('mouseout', (e) => {
              capa.resetStyle(e.target)
            })
          },
        }).addTo(mapa)

        capaRef.current = capa
        dibujarDestacado()
      })
      .catch(console.error)

    return () => { montado = false; }
  }, [onSectorSeleccionado, dibujarDestacado])

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      {/* Contenedor del mapa */}
      {/* F7 — role="img" le decía a la mayoría de lectores de pantalla que tratara el subárbol
          como no interactivo, ocultando los polígonos clicables y el link de atribución que sí
          viven dentro. "region" describe mejor un contenedor con interactividad real. */}
      <div
        ref={contenedorRef}
        id="contenedor-mapa"
        role="region"
        aria-label="Mapa interactivo de sectores de Cartagena con estado del servicio de agua"
        style={{ height: '100%', width: '100%' }}
      />

      {/* Solo aparece en pantallas táctiles, porque solo ahí existe el bloqueo (ver el efecto
          del arrastre). `role="status"` y no un `alert`: informa, no interrumpe. */}
      {aviso !== 'oculto' && (
        <p className={`mapa-aviso-gesto mapa-aviso-gesto--${aviso}`} role="status">
          {aviso === 'pista' ? 'Mantén pulsado para mover el mapa' : 'Ya puedes arrastrar el mapa'}
        </p>
      )}

      <div className="mapa-controles-inferior-izquierda">
        <button
          type="button"
          className="panel-glass mapa-boton-zoom"
          aria-label="Acercar el mapa"
          title="Acercar"
          disabled={zoom >= (mapaRef.current?.getMaxZoom() ?? 19)}
          onClick={() => mapaRef.current?.zoomIn()}
        >
          <Plus size={18} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="panel-glass mapa-boton-zoom"
          aria-label="Alejar el mapa"
          title="Alejar"
          disabled={zoom <= (mapaRef.current?.getMinZoom() ?? 0)}
          onClick={() => mapaRef.current?.zoomOut()}
        >
          <Minus size={18} aria-hidden="true" />
        </button>
      </div>

      {/* Frescura de los datos + botón "centrar mapa" — apilados, abajo a la derecha del recuadro */}
      <div className="mapa-controles-inferior-derecha">
        <button
          type="button"
          className="panel-glass mapa-boton-centrar"
          aria-label="Centrar mapa en la vista por defecto"
          title="Centrar mapa"
          onClick={() => mapaRef.current?.flyTo(CENTRO, ZOOM_INICIAL, { duration: 1 })}
        >
          <Locate size={18} aria-hidden="true" />
        </button>
        <EtiquetaFrescura timestampIso={ultimaActualizacion} conexionViva={conexionViva} />
      </div>

      {/* Overlay de carga con skeleton */}
      {cargando && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'var(--color-fondo)',
            opacity: 0.7,
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div className="skeleton" style={{ width: '180px', height: '24px', borderRadius: 'var(--radio-lg)' }} />
        </div>
      )}
    </div>
  )
}
