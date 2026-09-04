/**
 * createWaterField — motor del fondo de agua animado (Canvas 2D puro, sin dependencias).
 *
 * Agnóstico de React a propósito: monta el efecto sobre un contenedor + canvas ya
 * existentes y devuelve un `destroy()` para limpiar. Portado 1:1 desde el prototipo ya
 * validado visualmente — las constantes de sensación NO se tocan sin volver a mostrar el
 * resultado (ver comentario junto a cada una).
 *
 * Dos capas de movimiento, deliberadamente separadas:
 *  - Oleaje AMBIENTAL: ruido 2D (value noise, 2 octavas) que solo tiñe el color de cada
 *    vértice. Nunca mueve nada. Da vida al fondo aunque nadie toque el cursor.
 *  - Ondas del CURSOR: cada `pointermove` inyecta energía en una simulación de onda real
 *    (ecuación de onda discreta, dos buffers ping-pong). Esa energía es la ÚNICA fuente de
 *    desplazamiento de vértices (posición X/Y) — el cursor empuja el agua, no la ilumina.
 */

export interface WaterFieldHandle {
  destroy: () => void
}

// ─── Constantes validadas — no cambiar sin aprobación visual ───
const FACET_SIZE = 53 // px, tamaño de celda de la grilla
const WAVE_SPEED = 1.0 // multiplicador del oleaje ambiental
const RIPPLE_RADIUS = 120 // px, radio nominal de influencia del cursor
const NOISE_FREQ = 0.006
const WARP = FACET_SIZE * 0.045 // amplitud del desplazamiento por la onda
const RIPPLE_REACH_DIVISOR = 1.6 // reach = round(RIPPLE_RADIUS / cell / 1.6)
const RIPPLE_FALLOFF_POWER = 3 // falloff³ → caída espacial abrupta (muy local)
const RIPPLE_CLAMP = 2.5 // límite de energía por celda, evita explosiones
const RIPPLE_DAMPING = 0.93 // decaimiento temporal rápido
const FORCE_MIN = 0.08
const FORCE_PER_PX = 0.006
const FORCE_MAX = 0.55 // fuerza = min(FORCE_MAX, FORCE_MIN + distanciaMovida * FORCE_PER_PX)
const DPR_CAP = 1.5

const WATER_STOPS = ['#063a5e', '#0a5a90', '#1591c9', '#4fc7f2'] // rampa de color por elevación
const CREST = '#eafcff' // hacia donde vira el color en una cresta de onda
const TROUGH = '#02233a' // hacia donde vira el color en un valle de onda

// ─── Ruido de valor (2 octavas) ───
function hash(x: number, y: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123
  return s - Math.floor(s)
}

function smooth(t: number): number {
  return t * t * (3 - 2 * t)
}

function noise2D(x: number, y: number): number {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const xf = x - xi
  const yf = y - yi
  const u = smooth(xf)
  const v = smooth(yf)
  const n00 = hash(xi, yi)
  const n10 = hash(xi + 1, yi)
  const n01 = hash(xi, yi + 1)
  const n11 = hash(xi + 1, yi + 1)
  const nx0 = n00 + (n10 - n00) * u
  const nx1 = n01 + (n11 - n01) * u
  return nx0 + (nx1 - nx0) * v
}

function fbm(x: number, y: number): number {
  return noise2D(x * 0.9, y * 0.9) * 0.65 + noise2D(x * 2.1 + 100, y * 2.1 + 100) * 0.35
}

// ─── Color ───
function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

const stops = WATER_STOPS.map(hexToRgb)
const crest = hexToRgb(CREST)
const trough = hexToRgb(TROUGH)

function rampColor(t: number): [number, number, number] {
  const clamped = Math.max(0, Math.min(1, t))
  const seg = clamped * (stops.length - 1)
  const i = Math.min(stops.length - 2, Math.floor(seg))
  const f = seg - i
  const a = stops[i]
  const b = stops[i + 1]
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]
}

interface Point {
  x0: number
  y0: number
  x: number
  y: number
  n: number
  h: number
}

export function createWaterField(container: HTMLElement, canvas: HTMLCanvasElement): WaterFieldHandle {
  const ctx = canvas.getContext('2d')!
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const state = { paused: reducedMotion }

  const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP)
  let W = 0
  let H = 0
  let points: Point[][] = []
  let cols = 0
  let rows = 0
  let t = 0
  let ripA: Float32Array | null = null
  let ripB: Float32Array | null = null
  const mouse = { x: -9999, y: -9999, px: -9999, py: -9999 }

  function buildMesh(): void {
    const rect = container.getBoundingClientRect()
    W = rect.width
    H = rect.height
    canvas.width = Math.round(W * dpr)
    canvas.height = Math.round(H * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    cols = Math.ceil(W / FACET_SIZE) + 2
    rows = Math.ceil(H / FACET_SIZE) + 2
    points = []
    for (let r = 0; r < rows; r++) {
      const row: Point[] = []
      for (let c = 0; c < cols; c++) {
        const jx = (Math.random() - 0.5) * FACET_SIZE * 0.7
        const jy = (Math.random() - 0.5) * FACET_SIZE * 0.7
        const x0 = c * FACET_SIZE + jx - FACET_SIZE
        const y0 = r * FACET_SIZE + jy - FACET_SIZE
        row.push({ x0, y0, x: x0, y: y0, n: 0.5, h: 0 })
      }
      points.push(row)
    }
    ripA = new Float32Array(rows * cols)
    ripB = new Float32Array(rows * cols)
  }

  function injectRipple(px: number, py: number, force: number): void {
    if (!ripA) return
    const col = Math.round((px + FACET_SIZE) / FACET_SIZE)
    const row = Math.round((py + FACET_SIZE) / FACET_SIZE)
    const reach = Math.max(1, Math.round(RIPPLE_RADIUS / FACET_SIZE / RIPPLE_REACH_DIVISOR))
    for (let r = row - reach; r <= row + reach; r++) {
      if (r < 1 || r > rows - 2) continue
      for (let c = col - reach; c <= col + reach; c++) {
        if (c < 1 || c > cols - 2) continue
        const d = Math.sqrt((r - row) ** 2 + (c - col) ** 2)
        if (d > reach) continue
        const falloff = 1 - d / reach
        const idx = r * cols + c
        const v = ripA[idx] + force * falloff ** RIPPLE_FALLOFF_POWER
        ripA[idx] = Math.max(-RIPPLE_CLAMP, Math.min(RIPPLE_CLAMP, v))
      }
    }
  }

  function stepRipple(): void {
    if (!ripA || !ripB) return
    for (let r = 1; r < rows - 1; r++) {
      const base = r * cols
      for (let c = 1; c < cols - 1; c++) {
        const i = base + c
        const v = (ripA[i - 1] + ripA[i + 1] + ripA[i - cols] + ripA[i + cols]) * 0.5 - ripB[i]
        ripB[i] = v * RIPPLE_DAMPING
      }
    }
    const tmp = ripA
    ripA = ripB
    ripB = tmp
  }

  function drawTri(a: Point, b: Point, c: Point): void {
    const elev = (a.n + b.n + c.n) / 3
    const swell = (a.h + b.h + c.h) / 3
    const base = rampColor(elev + swell * 1.4)
    const shade = Math.max(-1, Math.min(1, swell * 3))
    const target = shade > 0 ? crest : trough
    const mix = Math.abs(shade) * 0.35
    const rr = base[0] + (target[0] - base[0]) * mix
    const gg = base[1] + (target[1] - base[1]) * mix
    const bb = base[2] + (target[2] - base[2]) * mix

    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    ctx.lineTo(c.x, c.y)
    ctx.closePath()
    ctx.fillStyle = `rgb(${rr | 0},${gg | 0},${bb | 0})`
    ctx.fill()
  }

  let running = true
  let rafId = 0

  function frame(): void {
    if (!running || !ripA) return
    if (!state.paused) t += 0.016 * WAVE_SPEED
    stepRipple()

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const p = points[r][c]
        p.n = fbm(p.x0 * NOISE_FREQ + t * 0.6, p.y0 * NOISE_FREQ + t * 0.4)
        const i = r * cols + c
        const hC = ripA[i]
        const hL = c > 0 ? ripA[i - 1] : hC
        const hR = c < cols - 1 ? ripA[i + 1] : hC
        const hU = r > 0 ? ripA[i - cols] : hC
        const hD = r < rows - 1 ? ripA[i + cols] : hC
        p.h = hC
        p.x = p.x0 + (hR - hL) * WARP
        p.y = p.y0 + (hD - hU) * WARP
      }
    }

    ctx.clearRect(0, 0, W, H)
    for (let r2 = 0; r2 < rows - 1; r2++) {
      for (let c2 = 0; c2 < cols - 1; c2++) {
        const p00 = points[r2][c2]
        const p10 = points[r2][c2 + 1]
        const p01 = points[r2 + 1][c2]
        const p11 = points[r2 + 1][c2 + 1]
        drawTri(p00, p10, p01)
        drawTri(p10, p11, p01)
      }
    }
    rafId = requestAnimationFrame(frame)
  }

  const onPointerMove = (e: PointerEvent): void => {
    const rect = container.getBoundingClientRect()
    mouse.x = e.clientX - rect.left
    mouse.y = e.clientY - rect.top
    const dx = mouse.x - mouse.px
    const dy = mouse.y - mouse.py
    const moved = mouse.px === -9999 ? 0 : Math.sqrt(dx * dx + dy * dy)
    if (moved > 1) injectRipple(mouse.x, mouse.y, Math.min(FORCE_MAX, FORCE_MIN + moved * FORCE_PER_PX))
    mouse.px = mouse.x
    mouse.py = mouse.y
  }
  const onPointerLeave = (): void => {
    mouse.px = -9999
    mouse.py = -9999
  }

  container.addEventListener('pointermove', onPointerMove)
  container.addEventListener('pointerleave', onPointerLeave)

  let resizeTimer: ReturnType<typeof setTimeout>
  const ro = new ResizeObserver(() => {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(buildMesh, 120)
  })
  ro.observe(container)

  const io = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && !running) {
      running = true
      rafId = requestAnimationFrame(frame)
    }
    if (!entry.isIntersecting) running = false
  })
  io.observe(container)

  buildMesh()
  rafId = requestAnimationFrame(frame)

  return {
    destroy() {
      running = false
      cancelAnimationFrame(rafId)
      ro.disconnect()
      io.disconnect()
      container.removeEventListener('pointermove', onPointerMove)
      container.removeEventListener('pointerleave', onPointerLeave)
    },
  }
}
