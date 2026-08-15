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
import { useCallback, useEffect, useRef } from 'react'
import type { FC } from 'react'
// (No se requiere Link aquí)
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Locate } from 'lucide-react'
import type { EstadoServicio, Sector } from '../types/tipos-dominio'
import { COLOR_POR_ESTADO, COLOR_SIN_DATOS } from '../types/tipos-dominio'
import { EtiquetaFrescura } from './EtiquetaFrescura'
import { obtenerGeoJSONBarrios } from '../data/barriosCartagena'

// Cartagena de Indias — centro, límites y zoom inicial
const CENTRO: L.LatLngExpression = [10.3950, -75.4800]
const ZOOM_INICIAL = 13
const BOUNDS_CARTAGENA: L.LatLngBoundsExpression = [
  [10.19, -75.68], // Suroeste (Expandido más al sur y al oeste para que no se corte Cartagena)
  [10.58, -75.35]  // Noreste (10.48 cortaba La Boquilla, que llega hasta ~10.4995: el mapa
  // la mostraba bien durante el flyToBounds pero al terminar la animación maxBoundsViscosity
  // lo empujaba de vuelta dentro del límite, dando el salto brusco. Margen extra sobre el
  // límite real del barrio para que el padding del flyToBounds no vuelva a chocar con el borde)
]

interface Props {
  sectores: Sector[]
  cargando: boolean
  ultimaActualizacion: string | null
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
export function volarABounds(mapa: L.Map, bounds: L.LatLngBounds, opciones: L.FitBoundsOptions): void {
  if (!bounds.isValid()) {
    console.warn('Se descart\u00f3 un flyToBounds con l\u00edmites inv\u00e1lidos', bounds)
    return
  }
  mapa.flyToBounds(bounds, opciones)
}

/** Estilo de un polígono — compartido entre la carga inicial y la actualización reactiva
 *  para que ambos caminos nunca diverjan en cómo se ve un barrio. */
function calcularEstiloFeature(
  sector: Sector | undefined,
  sectorActivo: Sector | null,
  estadoDestacado: EstadoServicio | null
): L.PathOptions {
  const estado = sector?.estado
  const color = estado ? COLOR_POR_ESTADO[estado].claro : COLOR_SIN_DATOS.claro
  const esActivo = !!(sectorActivo && sector && sectorActivo.id === sector.id)
  const enFoco = estadoDestacado !== null
  const esDestacado = !!(estado && estado === estadoDestacado)
  const atenuado = enFoco && !esDestacado

  // Sin estado verificado = zona sin sondar. No se le da un relleno de color porque no
  // tiene un estado que comunicar: se le da el rayado de carta náutica (ver el <pattern>
  // más abajo y .barrio-sin-sondar en index.css). Antes era '#ccc' al 15% de opacidad —
  // un gris tan tenue que el barrio desaparecía del mapa, que es la peor lectura posible:
  // "aquí no pasa nada" en vez de "aquí nadie ha mirado" (ADR-014).
  const sinSondar = !estado

  const clases = [
    sinSondar ? 'barrio-sin-sondar' : '',
    esDestacado ? `barrio-destacado barrio-destacado-${estado}` : '',
    esActivo ? 'barrio-seleccionado' : '',
  ].filter(Boolean).join(' ')

  return {
    fillColor: color,
    fillOpacity: sinSondar ? 1 : atenuado ? 0.08 : esDestacado ? 0.8 : esActivo ? 0.85 : 0.55,
    color: sinSondar ? COLOR_SIN_DATOS.claro : esDestacado ? color : '#ffffff',
    weight: esDestacado ? 3 : esActivo ? 2 : sinSondar ? 0.7 : 1,
    opacity: atenuado ? 0.18 : esActivo || esDestacado ? 1 : sinSondar ? 0.45 : 0.7,
    className: clases,
  }
}

export const MapaCartagena: FC<Props> = ({
  sectores,
  cargando,
  ultimaActualizacion,
  sectorActivo,
  estadoDestacado,
  onSectorSeleccionado,
}) => {
  const contenedorRef = useRef<HTMLDivElement>(null)
  const mapaRef = useRef<L.Map | null>(null)
  const capaRef = useRef<L.GeoJSON | null>(null)
  /** El encuadre automático es solo el de apertura: si el GeoJSON se recarga, el mapa no
   *  le arrebata al usuario el zoom al que él haya llegado. */
  const encuadreInicialHechoRef = useRef(false)
  /** Se levanta con el primer zoom o arrastre hecho por una persona. Desde ese momento
   *  ningún reajuste de tamaño vuelve a reencuadrar el mapa: mover la vista que alguien
   *  está mirando es de las cosas más molestas que puede hacer un mapa. */
  const usuarioMovioMapaRef = useRef(false)
  const capaBaseRef = useRef<L.TileLayer | null>(null)
  const destacadoLayerRef = useRef<L.LayerGroup | null>(null)

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
      volarABounds(mapa, L.latLngBounds(BOUNDS_CARTAGENA), { padding: [20, 20], duration: 1.2 })
      return
    }

    const centros: { nombre: string; centro: L.LatLng }[] = []
    const limites = L.latLngBounds([])

    capa.eachLayer((layer: any) => {
      const nombre = layer.feature?.properties?.NOMBRE ?? ''
      const sector = indiceSectores.current.get(normalizarNombre(nombre))
      if (sector?.estado !== estado) return
      const bounds = layer.getBounds ? layer.getBounds() : null
      if (!bounds || !bounds.isValid()) return
      // `getBounds().isValid()` solo confirma que hay esquinas SO/NE definidas, no que sean
      // finitas: `getCenter()` calcula un centroide (área con signo como divisor) y un anillo
      // degenerado puede devolver NaN aunque bounds.isValid() haya dado true. Mismo espíritu
      // que `volarABounds` — nunca construir un LatLng con NaN.
      const centro = typeof layer.getCenter === 'function' ? layer.getCenter() : bounds.getCenter()
      if (!Number.isFinite(centro.lat) || !Number.isFinite(centro.lng)) return
      centros.push({ nombre: sector.nombre, centro })
      limites.extend(bounds)
    })

    if (centros.length === 0) return

    const grupo = L.layerGroup()
    const color = COLOR_POR_ESTADO[estado].claro

    // Línea que conecta solo los barrios del estado destacado, en el orden en que aparecen
    // en el GeoJSON — no es la ruta más corta, es simplemente "estos son los que están en
    // este grupo ahora mismo".
    if (centros.length > 1) {
      L.polyline(centros.map((c) => c.centro), {
        color,
        weight: 2,
        opacity: 0.8,
        dashArray: '6 6',
        interactive: false,
      }).addTo(grupo)
    }

    // "Ping" con el nombre de cada barrio — por ahora solo el nombre; el ancla vive en el
    // span vía CSS (translate -50%,-100%) para que centre bien sin importar el largo del texto.
    centros.forEach(({ nombre, centro }) => {
      const icono = L.divIcon({
        className: 'ping-barrio-destacado',
        html: `<span class="ping-barrio-etiqueta" style="--color-ping:${color}">${nombre}</span>`,
      })
      L.marker(centro, { icon: icono, interactive: false, keyboard: false, zIndexOffset: 500 }).addTo(grupo)
    })

    grupo.addTo(mapa)
    destacadoLayerRef.current = grupo

    // El zoom lo decide fitBounds/flyToBounds solo, según cuánto abarquen los barrios
    // destacados — un solo barrio se acerca, varios dispersos se alejan.
    volarABounds(mapa, limites, { padding: [70, 70], duration: 1.2, maxZoom: 16 })
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
    })

    L.control.attribution({ position: 'bottomleft', prefix: false }).addTo(mapa)

    // La capa base cambia entre claro/oscuro según el tema activo, para que el mapa nunca
    // desentone con el resto de la interfaz (ver SelectorTema / useTheme).
    const mediaOscura = window.matchMedia('(prefers-color-scheme: dark)')
    const usarMapaOscuro = () => document.documentElement.dataset.theme === 'dark'
      || (!document.documentElement.dataset.theme && mediaOscura.matches)
    const actualizarCapaBase = () => {
      capaBaseRef.current?.remove()
      const oscuro = usarMapaOscuro()
      capaBaseRef.current = L.tileLayer(
        oscuro
          ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
          : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          attribution: oscuro
            ? '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/attributions">CARTO</a>'
            : '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        },
      ).addTo(mapa)
    }
    actualizarCapaBase()

    // Eventos del DOM y no de Leaflet: 'zoomstart'/'movestart' los emite por igual un
    // gesto de una persona y un flyTo del propio código (centrar, abrir un barrio,
    // destacar un estado), y tras esos el reencuadre automático sí debe seguir activo.
    // Una rueda, un puntero o una tecla sobre el contenedor solo los produce alguien.
    const marcarMovimientoDelUsuario = () => { usuarioMovioMapaRef.current = true }
    const contenedorMapa = mapa.getContainer()
    const opcionesPasivas = { passive: true } as const
    contenedorMapa.addEventListener('wheel', marcarMovimientoDelUsuario, opcionesPasivas)
    contenedorMapa.addEventListener('pointerdown', marcarMovimientoDelUsuario, opcionesPasivas)
    contenedorMapa.addEventListener('keydown', marcarMovimientoDelUsuario, opcionesPasivas)

    const observarTema = new MutationObserver(actualizarCapaBase)
    observarTema.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    mediaOscura.addEventListener('change', actualizarCapaBase)

    mapaRef.current = mapa
    return () => {
      observarTema.disconnect()
      mediaOscura.removeEventListener('change', actualizarCapaBase)
      contenedorMapa.removeEventListener('wheel', marcarMovimientoDelUsuario)
      contenedorMapa.removeEventListener('pointerdown', marcarMovimientoDelUsuario)
      contenedorMapa.removeEventListener('keydown', marcarMovimientoDelUsuario)
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
  useEffect(() => {
    const contenedor = contenedorRef.current
    if (!contenedor) return

    const ro = new ResizeObserver(() => {
      const mapa = mapaRef.current
      if (!mapa) return
      mapa.invalidateSize()

      // Re-encuadrar tras recalcular el tamaño, mientras el usuario no haya tomado el
      // control del mapa. invalidateSize por sí solo corrige la proyección pero conserva
      // el zoom, y ese zoom se había elegido contra un contenedor que todavía no medía lo
      // que mide ahora: el mapa quedaba encuadrado para una caja que ya no existe. Es la
      // causa de fondo del mapa "vacío" al abrir — el primer fitBounds corría mientras el
      // layout aún se asentaba.
      // En cuanto alguien mueve o hace zoom, esto deja de dispararse para siempre: nada
      // reencuadra el mapa por debajo de quien lo está usando.
      if (!usuarioMovioMapaRef.current) {
        mapa.fitBounds(BOUNDS_CARTAGENA, { padding: [16, 16], animate: false })
      }
    })
    ro.observe(contenedor)
    return () => ro.disconnect()
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
              // Un barrio que no está en la BD viaja con estado null — zona sin sondar —,
              // nunca inventado como CON_SERVICIO. Antes se fabricaba aquí un sector
              // "con servicio, actualizado en este momento" para cualquier barrio del
              // GeoJSON sin fila en la BD: el mapa le decía a un vecino que su barrio
              // tenía agua verificada hace un instante sin que nadie hubiera comprobado
              // nada. Es exactamente el falso positivo que ADR-014 prohíbe y el que el
              // proyecto entero existe para evitar.
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

        // Encuadre inicial contra BOUNDS_CARTAGENA y NO contra capa.getBounds().
        //
        // Encuadrar los 213 features deja el mapa inservible al abrir: el GeoJSON incluye
        // los corregimientos insulares —Islas del Rosario, Archipiélago de San Bernardo,
        // Isla Fuerte— que bajan hasta la latitud 9.38, a más de 100 km del casco urbano.
        // Su bounding box mide casi 1,3° de latitud y desborda el maxBounds de la ciudad;
        // como el mapa se construye con maxBoundsViscosity 1.0, Leaflet tiene que resolver
        // un encuadre imposible y termina en un zoom absurdo sobre una manzana cualquiera.
        // Ese era el mapa "vacío" con el que abría la página.
        //
        // Se encuadra la Cartagena que la gente consulta, que es la misma región que ya
        // declara maxBounds. Las islas siguen en la carta: se llega a ellas navegando.
        //
        // fitBounds y no setView(CENTRO, ZOOM): el zoom que hace falta depende de cuánto
        // mida el contenedor, y con un zoom constante el encuadre solo era correcto en la
        // ventana donde se eligió la constante.
        if (!encuadreInicialHechoRef.current) {
          mapa.fitBounds(BOUNDS_CARTAGENA, { padding: [16, 16] })
          encuadreInicialHechoRef.current = true
        }

        dibujarDestacado()
      })
      .catch(console.error)

    return () => { montado = false; }
  }, [onSectorSeleccionado, dibujarDestacado])

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      {/* Trama de zona sin sondar.
          Un <pattern> de SVG solo se puede referenciar con url(#id), así que tiene que
          existir en el documento aunque no se vea: este svg mide 0×0 y solo transporta la
          definición. Los polígonos de barrios sin dato verificado lo usan como relleno
          desde CSS (.barrio-sin-sondar), no desde las opciones de Leaflet, porque
          `fillColor` solo acepta un color plano.

          El rayado a 45° es la convención con la que una carta náutica marca el fondo que
          nadie ha sondado. Es el motivo de que un barrio sin verificar se vea distinto y
          no simplemente gris: gris es un color de estado más y esto no es un estado. */}
      <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: 'absolute' }}>
        <defs>
          <pattern id="trama-sin-sondar" patternUnits="userSpaceOnUse" width="7" height="7" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="7" stroke="currentColor" strokeWidth="1.15" />
          </pattern>
        </defs>
      </svg>

      {/* Contenedor del mapa */}
      <div
        ref={contenedorRef}
        id="contenedor-mapa"
        role="img"
        aria-label="Mapa interactivo de sectores de Cartagena con estado del servicio de agua"
        style={{ height: '100%', width: '100%' }}
      />

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
        <EtiquetaFrescura timestampIso={ultimaActualizacion} />
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
