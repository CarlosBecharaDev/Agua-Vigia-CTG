/**
 * barriosAcuacar.ts — puente entre cómo Acuacar nombra los barrios en sus boletines y cómo
 * los nombra el GeoJSON de D5 (`public/barrios-cartagena.geojson`, 211 polígonos).
 *
 * Por qué existe: el GeoJSON es catastral y Acuacar escribe en prosa, así que los dos
 * universos no coinciden. Dos problemas concretos, los dos verificados contra la API real
 * (150 boletines, 2025-12-03 → 2026-08-14, `/wp-json/wp/v2/posts`):
 *
 *  1. El GeoJSON parte Olaya Herrera en once polígonos (`OLAYA ST. RICAURTE`, `OLAYA ST.
 *     STELLA`, …) y Acuacar escribe "Olaya Herrera" o el nombre pelado del sector
 *     ("Ricaurte", "Zarabanda"). Ninguna de las dos formas calzaba nunca contra el nombre
 *     del polígono: Olaya Herrera es el barrio MÁS mencionado de todo el corpus (68 veces) y
 *     hasta ahora era invisible en el mapa. Lo mismo con `PABLO VI - I/II`, `REPUBLICA DE
 *     CHILE` o los barrios con numeral escrito en letras (`NUEVE DE ABRIL` ← "9 de Abril").
 *
 *  2. Acuacar nombra ~324 lugares que no tienen polígono en el GeoJSON: urbanizaciones y
 *     sectores dentro de un barrio. Se reconocen igual —si un boletín dice que Nabonasar
 *     se queda sin agua, eso es información real que el ciudadano debe ver— pero se marcan
 *     como `sinPoligono` y NO se dibujan: no inventamos geometría que nadie levantó.
 *
 * Curado a mano desde la frecuencia real del corpus, descartando lo que no es un barrio
 * aunque aparezca en las mismas enumeraciones: avenidas (Pedro de Heredia, Santander,
 * Crisanto Luque), monumentos (India Catalina), centros comerciales (Comercio Doña Manuela)
 * y referencias de tramo ("la Bomba El Gallo"). Al agregar un nombre nuevo aquí, la regla es
 * la de `CLAUDE.md`: solo si un boletín real lo nombra como barrio o sector afectado.
 */

/**
 * Lo que Acuacar escribe → el/los polígono(s) del GeoJSON que le corresponden.
 * Un alias puede apuntar a varios: "Olaya Herrera" cubre los once sectores, y "Pablo VI"
 * los dos polígonos en que el GeoJSON lo divide.
 */
export const ALIAS_DE_BARRIO: Record<string, string[]> = {
  // ── Olaya Herrera y sus once sectores ──
  'Olaya Herrera': [
    'OLAYA ST. CENTRAL', 'OLAYA ST. LA MAGDALENA', 'OLAYA ST. LA PUNTILLA',
    'OLAYA ST. PLAYA BLANCA', 'OLAYA ST. PROGRESO', 'OLAYA ST. RAFAEL NUÑEZ',
    'OLAYA ST. RICAURTE', 'OLAYA ST. STELLA', 'OLAYA ST. ZARABANDA',
    'OLAYA ST.11 DE NOVIEMBRE', 'OLAYA VILLA OLIMPICA',
  ],
  // "Ricaurte", "Progreso" y "Central" NO llevan alias a proposito, aunque sean sectores de
  // Olaya: son las tres palabras que `BUG-046` senalo como riesgosas, y el corpus confirma que
  // tenia razon. "canal Ricaurte" se usa como linde de OTROS barrios ("San Fernando, entre la
  // avenida El Consulado y el canal Ricaurte"); "El Progreso" existe tambien dentro de Nelson
  // Mandela y de Zaragocilla; "La Central" es otro sitio. No se pierde nada: cuando el boletin
  // enumera esos sectores siempre encabeza con "Olaya Herrera, sectores:", y ese alias ya marca
  // los once.
  'La Magdalena': ['OLAYA ST. LA MAGDALENA'],
  'La Puntilla': ['OLAYA ST. LA PUNTILLA'],
  'Playa Blanca': ['OLAYA ST. PLAYA BLANCA'],
  'Zarabanda': ['OLAYA ST. ZARABANDA'],
  'Stella': ['OLAYA ST. STELLA'],
  'Rafael Nuñez': ['OLAYA ST. RAFAEL NUÑEZ'],
  'Villa Olimpica': ['OLAYA VILLA OLIMPICA'],
  // Los dos polígonos con ese nombre: el sector de Olaya y la ciudadela, que son distintos
  // sitios. Acuacar escribe "11 de Noviembre" a secas, así que se marcan los dos.
  '11 de Noviembre': ['OLAYA ST.11 DE NOVIEMBRE', 'CIUDADELA 11 DE NOVIEMBRE'],

  // ── Numerales: el GeoJSON los escribe en letras, Acuacar en dígito ──
  '7 de Agosto': ['SIETE DE AGOSTO'],
  '9 de Abril': ['NUEVE DE ABRIL'],
  '13 de Junio': ['TRECE DE JUNIO'],
  '20 de Julio': ['VEINTE DE JULIO SUR'],

  // ── Nombres que el GeoJSON escribe largos y Acuacar corto ──
  'Pablo VI': ['PABLO VI - I', 'PABLO VI - II'],
  'Chile': ['REPUBLICA DE CHILE'],
  'El Libano': ['REPUBLICA DEL LIBANO'],
  'El Caribe': ['REPUBLICA DEL CARIBE'],
  'La Esmeralda': ['LA ESMERALDA I', 'LA ESMERALDA II'],
  'Los Calamares': ['CALAMARES'],
}

/**
 * Lugares que Acuacar nombra como afectados y que el GeoJSON no tiene. Se reconocen en el
 * texto y aparecen en la lista y el buscador, pero sin polígono: el mapa no los pinta.
 * Ordenados por frecuencia en el corpus, de mayor a menor.
 */
export const BARRIOS_SIN_POLIGONO: string[] = [
  'Los Cocos', 'Brisas de La Cordialidad', 'Villa Andrea', '18 de Enero', 'El Eden',
  'Panorama', 'Lomas del Peye', 'Villa Concha', 'La Primavera', '7 de Diciembre',
  'Beirut', 'Rincon de La Villa', 'Villa del Sol', 'San Buenaventura', 'Nabonasar',
  'La Princesa', 'Llano Verde', 'Colinas de Betania', 'Pantano de Vargas', 'Las Americas',
  'Ucopin', 'Portal del Virrey', '2 de Noviembre', 'Colombiaton', 'Sevilla',
  'Nuevo Chile', 'Nueva Venecia', 'Pardo Leal', 'Sor Teresa de Calcuta', 'Villa del Rosario',
  'El Silencio', 'La Gaitana', 'Costa Linda', 'El Nazareno', 'Los Ciruelos',
  'Los Abetos', 'Sevilla Real', 'Ciudad Sevilla', 'Villas de Aranjuez', 'Alpes Club',
  'Terraza Los Alpes', 'Los Cerezos', 'Madrigal', 'Las Margaritas', 'Nuevo Milenio',
  'Lomas de San Francisco', 'Castillete', 'Mallorca', 'Parque de Zaragocilla',
  'El Mirador de Zaragocilla', 'Buenavista', 'Jardines de Junio', 'Quintas de Alta Lucia',
  'Boulevard de La Castellana', 'Contadora', 'Florida Blanca', 'La Caracola', 'Manzanares',
  'El Cairo', 'Coomuldesecar', 'Paraiso Real', 'Valencia', 'Cielo Mar', 'Tequendama',
  'La Heroica', 'El Golf', 'Ciudad del Bicentenario', 'Rosedal', 'Barceloneta',
  'Portal de Las Americas', 'Terranova', 'Serena del Mar', 'Parque de Bolivar',
  'San Vicente de Paul', 'Crespito', 'Villa Carmen', 'Bella Suiza', 'Nueva Colombia',
  'Los Pinos', 'Las Colinas', 'El Millo', 'Belen', 'Portal de La Cordialidad', 'Asturias',
  'Casas Militares', 'Plan 400', 'Camino del Medio', 'Ciudadela La Paz', 'Revivir',
  'Campanitas', 'Cristo Rey', 'Arachera', 'Las Canteras', 'Minuto de Dios', 'Las Reinas',
  'Altos de San Pedro Martir', 'Altos Jardines', 'Nuevos Jardines', 'La Coquera',
  'Villa Angela', 'Navas Meisel', 'Los Deseos', 'Sinai', '13 de Mayo',
  // Los dos nombres que `BUG-047` dejo en el aire: D5 no tiene poligono para ninguno y no se
  // invento una correspondencia. Aqui vuelven a ser visibles —en lista y buscador, no en el
  // mapa— que es justo la informacion que ese bug reportaba como perdida.
  'Maria Auxiliadora', 'Salim Bechara',
]
