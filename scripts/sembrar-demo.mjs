import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGODB_DB ?? 'aguavigia';

async function main() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const sectoresCol = db.collection('sectores');
    const bitacoraCol = db.collection('eventos_bitacora');
    const cortesCol = db.collection('cortes');

    const sectores = await sectoresCol.find({}).toArray();
    if (sectores.length === 0) {
      console.error('No hay sectores. Ejecuta sembrar-sectores primero.');
      return;
    }

    console.log(`Actualizando estados dinámicos para ${sectores.length} sectores...`);

    const ahora = new Date();
    
    // Asignar distribución realista de estados exclusivamente en el área urbana continental
    const sinServicioSlugs = ['el-pozon', 'olaya-herrera', 'nelson-mandela', 'san-jose-de-los-campanos', 'ceballos', 'armenia', 'lo-amador', 'el-carmen'];
    const presionBajaSlugs = ['bocagrande', 'el-laguito', 'castillogrande', 'manga', 'getsemani', 'centro', 'crespo', 'marbella', 'cabrero', 'torices', 'pie-de-la-popa'];
    const corteProgSlugs = ['zaragocilla', 'la-campiña', 'los-alpes', 'terron-de-azucar', 'providencia', 'santa-monica', 'las-gaviotas'];

    const bitacoraEventos = [];

    for (const s of sectores) {
      // Ignorar islas ultra remotas para estados de corte
      const esIslaLejana = ['isla-fuerte', 'san-bernardo', 'islas-del-rosario'].includes(s.slug);
      let estado = 'CON_SERVICIO';
      if (!esIslaLejana) {
        if (sinServicioSlugs.includes(s.slug)) {
          estado = 'SIN_SERVICIO';
        } else if (presionBajaSlugs.includes(s.slug)) {
          estado = 'PRESION_BAJA';
        } else if (corteProgSlugs.includes(s.slug)) {
          estado = 'CORTE_PROGRAMADO';
        } else {
          const r = Math.random();
          if (r < 0.03) estado = 'SIN_SERVICIO';
          else if (r < 0.08) estado = 'PRESION_BAJA';
          else if (r < 0.12) estado = 'CORTE_PROGRAMADO';
        }
      }

      const tiempoActualizado = new Date(ahora.getTime() - Math.floor(Math.random() * 3600 * 1000 * 4));
      await sectoresCol.updateOne(
        { _id: s._id },
        { 
          $set: { 
            estadoActual: estado,
            estadoActualizadoEn: tiempoActualizado
          } 
        }
      );

      // Generar evento de bitácora correspondiente si tiene incidencia
      if (estado === 'SIN_SERVICIO') {
        bitacoraEventos.push({
          tipo: 'CORTE_CONFIRMADO_POR_CIUDADANOS',
          sectorId: s.slug,
          timestamp: tiempoActualizado,
          descripcion: `Masa crítica de reportes ciudadanos confirmó interrupción del suministro de agua en el barrio ${s.nombre}.`
        });
      } else if (estado === 'PRESION_BAJA') {
        bitacoraEventos.push({
          tipo: 'CORTE_CONFIRMADO_POR_CIUDADANOS',
          sectorId: s.slug,
          timestamp: tiempoActualizado,
          descripcion: `Reportes comunitarios constantes indican caída severa de presión en las redes de ${s.nombre}.`
        });
      } else if (estado === 'CORTE_PROGRAMADO') {
        bitacoraEventos.push({
          tipo: 'CORTE_ANUNCIADO',
          sectorId: s.slug,
          timestamp: tiempoActualizado,
          descripcion: `Aviso oficial de corte preventivo por mantenimiento de red matriz en ${s.nombre}.`
        });
      } else {
        // Algunos eventos de restablecimiento
        if (Math.random() < 0.1) {
          bitacoraEventos.push({
            tipo: 'CORTE_RESTABLECIDO',
            sectorId: s.slug,
            timestamp: tiempoActualizado,
            descripcion: `Servicio normalizado y presión regular restablecida en el sector ${s.nombre}.`
          });
        }
      }
    }

    // Ordenar bitácora por fecha descendente
    bitacoraEventos.sort((a, b) => b.timestamp - a.timestamp);

    await bitacoraCol.deleteMany({});
    if (bitacoraEventos.length > 0) {
      await bitacoraCol.insertMany(bitacoraEventos);
    }

    console.log(`✅ Estados de sectores actualizados.`);
    console.log(`✅ ${bitacoraEventos.length} eventos registrados en la bitácora pública.`);
  } finally {
    await client.close();
  }
}

main().catch(console.error);
