# AguaVigía CTG — Frontend

Aplicación web de una sola página (SPA) para la plataforma de monitoreo del acueducto en Cartagena de Indias.

**Stack:** React 19 · Vite · TypeScript · Tailwind CSS v4  
**Rol responsable:** D4 — José Daniel Zambrano  
**Módulos:** M1 (Mapa en vivo) · M2 (Reporte ciudadano - UI) · M5 (Panel del veedor - UI)

---

## Estructura

```
src/
├── components/     # Componentes reutilizables (Encabezado, SelectorTema…)
├── hooks/          # Hooks propios (useTheme…)
├── pages/          # Una página por ruta (PaginaMapa, PaginaReportar…)
├── index.css       # Tokens de diseño — fuente única (DESIGN.md)
└── main.tsx        # Punto de entrada
```

## Levantar en desarrollo

```bash
npm install
npm run dev       # http://localhost:5173
```

## Diseño

Los tokens de color, tipografía y espaciado viven en [`src/index.css`](src/index.css)  
como custom properties CSS. La fuente de verdad es [`../DESIGN.md`](../DESIGN.md).

## Compuertas

- **Depende de C2** (contrato OpenAPI publicado por D3/D1) para integrar datos reales.  
- Sin C2, se avanza en maquetación, tokens y accesibilidad estática.  
- Ver [`../docs/equipo/secuencia-de-trabajo.md`](../docs/equipo/secuencia-de-trabajo.md).
