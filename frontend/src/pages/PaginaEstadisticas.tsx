/**
 * PaginaEstadisticas — M7 (Estadísticas).
 * UI inicial de Dashboard con Recharts usando datos MOCK.
 * Sprint 4: Se conecta con el API cuando C2 se abra.
 */
import type { FC } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts'

// MOCK DATA - Reemplazar con API real
const datosCumplimiento = [
  { mes: 'Ene', prometida: 4.5, real: 5.2 },
  { mes: 'Feb', prometida: 3.0, real: 3.1 },
  { mes: 'Mar', prometida: 4.0, real: 5.8 },
  { mes: 'Abr', prometida: 2.5, real: 2.5 },
  { mes: 'May', prometida: 3.5, real: 4.1 },
]

const datosSectoresAfectados = [
  { nombre: 'EL CENTRO', cortes: 12 },
  { nombre: 'MANGA', cortes: 8 },
  { nombre: 'BOCAGRANDE', cortes: 5 },
  { nombre: 'LA BOQUILLA', cortes: 4 },
  { nombre: 'GETSEMANI', cortes: 2 },
]

const PaginaEstadisticas: FC = () => {
  return (
    <main id="contenido-principal" role="main" aria-label="Estadísticas del servicio de agua en Cartagena">
      <div style={{ padding: '2rem 1.25rem', maxWidth: '1000px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', marginBottom: '0.5rem', color: 'var(--color-tinta)' }}>
              Estadísticas
            </h1>
            <p style={{ color: 'var(--color-tinta-2)', fontSize: '1rem' }}>
              Transparencia y seguimiento del servicio de acueducto en Cartagena.
            </p>
          </div>
          
          <button style={{ backgroundColor: 'var(--color-superficie)', color: 'var(--color-acento)', border: '1px solid var(--color-acento)', padding: '0.75rem 1rem', borderRadius: 'var(--radio-base)', fontWeight: '600', cursor: 'pointer' }}>
            📥 Exportar Datos (CSV)
          </button>
        </div>

        {/* Indice de Cumplimiento (RF024) */}
        <section style={{ backgroundColor: 'var(--color-superficie)', padding: '1.5rem', borderRadius: 'var(--radio-md)', border: '1px solid var(--color-linea)', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--color-tinta)' }}>Índice de Cumplimiento Global</h2>
          <p style={{ color: 'var(--color-tinta-2)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            Comparación entre la duración anunciada de los cortes vs. la duración real (en horas).
          </p>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={datosCumplimiento} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-linea)" />
                <XAxis dataKey="mes" stroke="var(--color-tinta-2)" />
                <YAxis stroke="var(--color-tinta-2)" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--color-superficie)', border: '1px solid var(--color-linea)', borderRadius: 'var(--radio-base)' }}
                  itemStyle={{ color: 'var(--color-tinta)' }}
                />
                <Legend />
                <Line type="monotone" dataKey="prometida" name="Duración Prometida (h)" stroke="var(--color-acento)" activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="real" name="Duración Real (h)" stroke="var(--color-estado-sin)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Sectores más afectados (RF023) */}
        <section style={{ backgroundColor: 'var(--color-superficie)', padding: '1.5rem', borderRadius: 'var(--radio-md)', border: '1px solid var(--color-linea)' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--color-tinta)' }}>Sectores más afectados</h2>
          <p style={{ color: 'var(--color-tinta-2)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            Número de cortes registrados en los últimos 30 días.
          </p>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={datosSectoresAfectados} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-linea)" />
                <XAxis type="number" stroke="var(--color-tinta-2)" />
                <YAxis dataKey="nombre" type="category" stroke="var(--color-tinta-2)" width={100} />
                <Tooltip 
                  cursor={{ fill: 'var(--color-fondo)' }}
                  contentStyle={{ backgroundColor: 'var(--color-superficie)', border: '1px solid var(--color-linea)', borderRadius: 'var(--radio-base)' }}
                />
                <Bar dataKey="cortes" name="Número de Cortes" fill="var(--color-estado-baja)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

      </div>
    </main>
  )
}

export default PaginaEstadisticas
