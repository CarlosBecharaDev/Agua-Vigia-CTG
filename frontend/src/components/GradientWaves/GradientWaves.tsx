/**
 * GradientWaves — fondo del hero de "Mapa en vivo". Adaptado de reactbits.dev
 * (Backgrounds → Gradient Waves) a TypeScript, conservando el shader y los valores por
 * defecto originales, incluida su paleta morada/rosa.
 *
 * Reemplaza al antiguo WaterField (Canvas 2D + malla triangulada): esto es WebGL2 puro vía
 * `ogl`, con un fragment shader de ray marching que dibuja una superficie de olas 3D.
 *
 * El `<canvas>` se declara en JSX (no lo crea `ogl`) para poder anidar `children` DENTRO
 * del mismo contenedor que escucha `pointermove` — igual que hacía WaterField: el mapa de
 * Leaflet y el panel de sectores cubren el canvas visualmente pero el evento sigue
 * llegando porque burbujea desde los hijos hacia el contenedor.
 */
import { useEffect, useRef } from 'react'
import type { FC, ReactNode } from 'react'
import { Renderer, Program, Mesh, Triangle } from 'ogl'

interface Props {
  className?: string
  children?: ReactNode
  horizonColor?: string
  waveColor?: string
  crestColor?: string
  speed?: number
  amplitude?: number
  waveScale?: number
  waveRatio?: number
  swell?: number
  turbulence?: number
  tilt?: number
  zoom?: number
  height?: number
  fogDepth?: number
  detail?: 'low' | 'medium' | 'high'
  brightness?: number
  opacity?: number
  mouseInteraction?: boolean
  parallaxStrength?: number
  grain?: boolean
  grainIntensity?: number
}

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return [1, 1, 1]
  return [parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255]
}

function detailToSteps(detail: Props['detail']): number {
  if (detail === 'low') return 40.0
  if (detail === 'high') return 110.0
  return 70.0
}

const vertex = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`

const fragment = `#version 300 es
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform float uSpeed;
uniform float uAmplitude;
uniform float uWaveScale;
uniform float uWaveRatio;
uniform float uSwell;
uniform float uTurbulence;
uniform float uTilt;
uniform float uZoom;
uniform float uHeight;
uniform float uFogDepth;
uniform float uSteps;
uniform float uBrightness;
uniform float uOpacity;
uniform float uGrain;
uniform float uGrainIntensity;
uniform vec2 uMouse;
uniform float uParallax;
uniform bool uEnableMouse;
uniform vec3 uHorizonColor;
uniform vec3 uWaveColor;
uniform vec3 uCrestColor;
out vec4 fragColor;

const float MAX_DIST = 20000.0;

float hash21(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float plasma(vec3 r, vec2 freq, vec4 tc) {
  float mx = r.x + tc.x;
  mx += uSwell * sin((r.y + mx) / 20.0 + tc.y);
  float my = r.y - tc.z;
  my += uTurbulence * cos(r.x / 23.0 + tc.w);
  return r.z - (sin(mx * freq.x) * uAmplitude + sin(my * freq.y) * uAmplitude + uHeight);
}

float raymarch(vec3 pos, vec3 dir, vec2 freq, vec4 tc) {
  float dist = 0.0;
  for (int i = 0; i < 128; i++) {
    if (float(i) >= uSteps) break;
    float dscene = plasma(pos + dist * dir, freq, tc);
    if (abs(dscene) < 0.1) break;
    dist += 0.9 * dscene;
    if (!(abs(dist) < MAX_DIST)) return MAX_DIST;
  }
  return dist;
}

void main() {
  float T = iTime * uSpeed;
  vec2 freq = vec2(uWaveScale / 7.0, (uWaveScale * uWaveRatio) / 3.0);
  vec4 tc = vec4(T / 0.130, T / 0.810, T / 0.200, T / 0.710);
  float c, s;
  float vfov = (3.14159 / 2.3) / max(uZoom, 0.05);
  vec3 cam = vec3(0.0, 0.0, 30.0);
  vec2 uv = (gl_FragCoord.xy / iResolution.xy) - 0.5;
  uv.x *= iResolution.x / iResolution.y;
  uv.y *= -1.0;

  vec3 dir = vec3(0.0, 0.0, -1.0);
  float ulen = length(uv);
  float xrot = vfov * ulen;
  c = cos(xrot); s = sin(xrot);
  dir = mat3(1.0, 0.0, 0.0, 0.0, c, -s, 0.0, s, c) * dir;
  vec2 nuv = ulen > 1e-5 ? uv / ulen : vec2(1.0, 0.0);
  c = nuv.x; s = nuv.y;
  dir = mat3(c, -s, 0.0, s, c, 0.0, 0.0, 0.0, 1.0) * dir;
  c = cos(uTilt); s = sin(uTilt);
  dir = mat3(c, 0.0, s, 0.0, 1.0, 0.0, -s, 0.0, c) * dir;

  if (uEnableMouse) {
    float yaw = (uMouse.x - 0.5) * uParallax * 0.4;
    float pitch = (uMouse.y - 0.5) * uParallax * 0.4;
    c = cos(yaw); s = sin(yaw);
    dir = mat3(c, 0.0, s, 0.0, 1.0, 0.0, -s, 0.0, c) * dir;
    c = cos(pitch); s = sin(pitch);
    dir = mat3(1.0, 0.0, 0.0, 0.0, c, -s, 0.0, s, c) * dir;
  }

  float dist = raymarch(cam, dir, freq, tc);
  vec3 pos = cam + dist * dir;

  float t = clamp(uFogDepth / max(dist, 0.001), 0.0, 1.0);
  vec3 body = mix(uWaveColor, uCrestColor, clamp(pos.z * 0.08 + 0.5, 0.0, 1.0));
  vec3 col = mix(uHorizonColor, body, t);
  col *= uBrightness;
  col = clamp(col, 0.0, 1.0);

  float alpha = clamp(t, 0.0, 1.0) * uOpacity;
  if (uGrain > 0.5) {
    float g = hash21(gl_FragCoord.xy + mod(iTime, 64.0) * 11.0);
    alpha += (g - 0.5) * uGrainIntensity;
  }
  alpha = clamp(alpha, 0.0, 1.0);
  fragColor = vec4(col * alpha, alpha);
}
`

// ─── Paleta original de reactbits.dev (Backgrounds → Gradient Waves) ───
const HORIZON_COLOR = '#5227FF'
const WAVE_COLOR = '#FF9FFC'
const CREST_COLOR = '#FFFFFF'

export const GradientWaves: FC<Props> = ({
  className,
  children,
  horizonColor = HORIZON_COLOR,
  waveColor = WAVE_COLOR,
  crestColor = CREST_COLOR,
  speed = 0.4,
  amplitude = 2.5,
  waveScale = 0.6,
  waveRatio = 0.9,
  swell = 35,
  turbulence = 20,
  tilt = 1.11,
  zoom = 1.0,
  height = 5.5,
  fogDepth = 15,
  detail = 'medium',
  brightness = 1.0,
  opacity = 1.0,
  mouseInteraction = true,
  parallaxStrength = 0.5,
  grain = true,
  grainIntensity = 0.05,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const enableMouseRef = useRef(mouseInteraction)
  const programRef = useRef<Program | null>(null)

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const renderer = new Renderer({
      canvas,
      webgl: 2,
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      dpr: Math.min(window.devicePixelRatio || 1, 2),
    })
    const gl = renderer.gl
    gl.clearColor(0, 0, 0, 0)

    const geometry = new Triangle(gl)
    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        iTime: { value: 0 },
        iResolution: { value: new Float32Array([1, 1]) },
        uSpeed: { value: speed },
        uAmplitude: { value: amplitude },
        uWaveScale: { value: waveScale },
        uWaveRatio: { value: waveRatio },
        uSwell: { value: swell },
        uTurbulence: { value: turbulence },
        uTilt: { value: tilt },
        uZoom: { value: zoom },
        uHeight: { value: height },
        uFogDepth: { value: fogDepth },
        uSteps: { value: detailToSteps(detail) },
        uBrightness: { value: brightness },
        uOpacity: { value: opacity },
        uGrain: { value: grain ? 1.0 : 0.0 },
        uGrainIntensity: { value: grainIntensity },
        uMouse: { value: new Float32Array([0.5, 0.5]) },
        uParallax: { value: parallaxStrength },
        uEnableMouse: { value: mouseInteraction },
        uHorizonColor: { value: new Float32Array(hexToRgb(horizonColor)) },
        uWaveColor: { value: new Float32Array(hexToRgb(waveColor)) },
        uCrestColor: { value: new Float32Array(hexToRgb(crestColor)) },
      },
    })
    programRef.current = program

    const mesh = new Mesh(gl, { geometry, program })

    // Strict Mode (dev) monta este efecto, lo limpia y lo vuelve a montar de una — el
    // ResizeObserver del primer montaje a veces entrega su notificación inicial DESPUÉS de
    // que su cleanup ya llamó disconnect() (una notificación ya encolada por el navegador no
    // siempre se cancela a tiempo). Sin esta bandera, ese callback tardío intenta dibujar con
    // un `program` que ya no es el vigente y explota. En producción no hay Strict Mode, así
    // que `disposed` nunca pasa a `true` antes de que el efecto real termine su ciclo de vida.
    let disposed = false

    const setSize = (): void => {
      if (disposed) return
      const rect = container.getBoundingClientRect()
      const w = Math.max(1, Math.floor(rect.width))
      const h = Math.max(1, Math.floor(rect.height))
      renderer.setSize(w, h)
      const res = program.uniforms.iResolution.value as Float32Array
      res[0] = gl.drawingBufferWidth
      res[1] = gl.drawingBufferHeight
      renderer.render({ scene: mesh })
    }

    const ro = new ResizeObserver(setSize)
    ro.observe(container)
    setSize()

    const currentMouse = [0.5, 0.5]
    const targetMouse = [0.5, 0.5]

    const onPointerMove = (e: PointerEvent): void => {
      const rect = container.getBoundingClientRect()
      targetMouse[0] = (e.clientX - rect.left) / rect.width
      targetMouse[1] = 1.0 - (e.clientY - rect.top) / rect.height
    }
    const onPointerLeave = (): void => {
      targetMouse[0] = 0.5
      targetMouse[1] = 0.5
    }
    container.addEventListener('pointermove', onPointerMove)
    container.addEventListener('pointerleave', onPointerLeave)

    let raf = 0
    let isVisible = true
    let isPageVisible = !document.hidden
    const t0 = performance.now()

    const loop = (t: number): void => {
      if (disposed) return
      program.uniforms.iTime.value = (t - t0) * 0.001
      const tx = enableMouseRef.current ? targetMouse[0] : 0.5
      const ty = enableMouseRef.current ? targetMouse[1] : 0.5
      currentMouse[0] += 0.05 * (tx - currentMouse[0])
      currentMouse[1] += 0.05 * (ty - currentMouse[1])
      const uMouse = program.uniforms.uMouse.value as Float32Array
      uMouse[0] = currentMouse[0]
      uMouse[1] = currentMouse[1]
      renderer.render({ scene: mesh })
      raf = requestAnimationFrame(loop)
    }

    const tryStart = (): void => {
      if (!reducedMotion && isVisible && isPageVisible && raf === 0) raf = requestAnimationFrame(loop)
    }
    const tryStop = (): void => {
      if (raf !== 0) {
        cancelAnimationFrame(raf)
        raf = 0
      }
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting
        isVisible ? tryStart() : tryStop()
      },
      { threshold: 0 }
    )
    io.observe(container)

    const onVisibility = (): void => {
      isPageVisible = !document.hidden
      isPageVisible ? tryStart() : tryStop()
    }
    document.addEventListener('visibilitychange', onVisibility)

    if (reducedMotion) {
      renderer.render({ scene: mesh })
    } else {
      tryStart()
    }

    return () => {
      disposed = true
      tryStop()
      ro.disconnect()
      io.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      container.removeEventListener('pointermove', onPointerMove)
      container.removeEventListener('pointerleave', onPointerLeave)
      programRef.current = null
      // Sin loseContext(): el <canvas> es el mismo nodo DOM entre montajes (declarado en
      // JSX, no creado por ogl) — en el doble efecto de Strict Mode, perder el contexto
      // aquí lo deja inservible para el segundo montaje real (getShaderInfoLog empieza a
      // devolver null y el programa nunca linkea). El navegador libera el contexto solo
      // cuando el canvas se recolecta de verdad.
    }
    // Los cambios de props se aplican vía uniforms en el efecto de abajo, no reconstruyendo
    // el contexto WebGL — recrearlo en cada cambio perdería el frame animado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    enableMouseRef.current = mouseInteraction
    const program = programRef.current
    if (!program) return
    const u = program.uniforms
    u.uSpeed.value = speed
    u.uAmplitude.value = amplitude
    u.uWaveScale.value = waveScale
    u.uWaveRatio.value = waveRatio
    u.uSwell.value = swell
    u.uTurbulence.value = turbulence
    u.uTilt.value = tilt
    u.uZoom.value = zoom
    u.uHeight.value = height
    u.uFogDepth.value = fogDepth
    u.uSteps.value = detailToSteps(detail)
    u.uBrightness.value = brightness
    u.uOpacity.value = opacity
    u.uGrain.value = grain ? 1.0 : 0.0
    u.uGrainIntensity.value = grainIntensity
    u.uParallax.value = parallaxStrength
    u.uEnableMouse.value = mouseInteraction
    ;(u.uHorizonColor.value as Float32Array).set(hexToRgb(horizonColor))
    ;(u.uWaveColor.value as Float32Array).set(hexToRgb(waveColor))
    ;(u.uCrestColor.value as Float32Array).set(hexToRgb(crestColor))
  }, [
    horizonColor,
    waveColor,
    crestColor,
    speed,
    amplitude,
    waveScale,
    waveRatio,
    swell,
    turbulence,
    tilt,
    zoom,
    height,
    fogDepth,
    detail,
    brightness,
    opacity,
    grain,
    grainIntensity,
    mouseInteraction,
    parallaxStrength,
  ])

  return (
    <div ref={containerRef} className={className} style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
      />
      {children}
    </div>
  )
}
