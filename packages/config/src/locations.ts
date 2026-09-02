/**
 * Árbol de ubicaciones de República Dominicana usado para búsqueda, filtros y
 * páginas SEO por zona (`/properties/[location]`).
 *
 * `slug` es estable y se usa en URLs. Las coordenadas son aproximadas al centro
 * de la zona (para centrar el mapa, no para geocoding exacto).
 *
 * Este archivo es el catálogo semilla; la fuente de verdad en runtime es la
 * tabla `locations` (se puebla desde aquí en el seed).
 */

import { LOCATION_TYPE, type LocationType } from "./enums";

export interface LocationNode {
  slug: string;
  name: string;
  type: LocationType;
  /** slug del padre; null para el país */
  parentSlug: string | null;
  latitude: number;
  longitude: number;
  /** aparece en "búsquedas rápidas" del home */
  isFeatured?: boolean;
  /** texto corto para meta description de la página de zona */
  blurb?: string;
}

export const COUNTRY_SLUG = "republica-dominicana";

export const LOCATIONS: LocationNode[] = [
  {
    slug: COUNTRY_SLUG,
    name: "República Dominicana",
    type: LOCATION_TYPE.COUNTRY,
    parentSlug: null,
    latitude: 18.7357,
    longitude: -70.1627,
  },

  // ─── Distrito Nacional ────────────────────────────────────────────────────
  {
    slug: "distrito-nacional",
    name: "Distrito Nacional",
    type: LOCATION_TYPE.PROVINCE,
    parentSlug: COUNTRY_SLUG,
    latitude: 18.4801,
    longitude: -69.9424,
    isFeatured: true,
    blurb:
      "El corazón urbano de Santo Domingo: torres modernas, gastronomía y los sectores más demandados del país.",
  },
  {
    slug: "santo-domingo-dn",
    name: "Santo Domingo (D.N.)",
    type: LOCATION_TYPE.MUNICIPALITY,
    parentSlug: "distrito-nacional",
    latitude: 18.4801,
    longitude: -69.9424,
    isFeatured: true,
    blurb:
      "Compra, alquila o invierte en la ciudad capital: apartamentos, penthouses y proyectos de obra nueva.",
  },
  { slug: "piantini", name: "Piantini", type: LOCATION_TYPE.SECTOR, parentSlug: "santo-domingo-dn", latitude: 18.4699, longitude: -69.9385, isFeatured: true, blurb: "El sector más exclusivo del Distrito Nacional: torres premium, embajadas y la mejor oferta gastronómica." },
  { slug: "naco", name: "Naco", type: LOCATION_TYPE.SECTOR, parentSlug: "santo-domingo-dn", latitude: 18.4759, longitude: -69.9337, isFeatured: true, blurb: "Zona residencial consolidada y céntrica, con excelente plusvalía y vida de barrio urbana." },
  { slug: "bella-vista", name: "Bella Vista", type: LOCATION_TYPE.SECTOR, parentSlug: "santo-domingo-dn", latitude: 18.4547, longitude: -69.9436, blurb: "Residencial tranquilo cerca del malecón, con proyectos nuevos y buen equilibrio precio-ubicación." },
  { slug: "evaristo-morales", name: "Evaristo Morales", type: LOCATION_TYPE.SECTOR, parentSlug: "santo-domingo-dn", latitude: 18.4693, longitude: -69.9295, blurb: "Sector en auge para inversión: mucha obra nueva y demanda de alquiler." },
  { slug: "serralles", name: "Serrallés", type: LOCATION_TYPE.SECTOR, parentSlug: "santo-domingo-dn", latitude: 18.4724, longitude: -69.9331, blurb: "Contiguo a Piantini, residencial de alto nivel y muy demandado." },
  { slug: "los-cacicazgos", name: "Los Cacicazgos", type: LOCATION_TYPE.SECTOR, parentSlug: "santo-domingo-dn", latitude: 18.4413, longitude: -69.9509, blurb: "Uno de los sectores más cotizados, arbolado y cercano al mar Caribe." },
  { slug: "gazcue", name: "Gazcue", type: LOCATION_TYPE.SECTOR, parentSlug: "santo-domingo-dn", latitude: 18.4645, longitude: -69.9008, blurb: "Barrio histórico y cultural, con arquitectura de los años 40 y renovación constante." },
  { slug: "zona-colonial", name: "Zona Colonial", type: LOCATION_TYPE.SECTOR, parentSlug: "santo-domingo-dn", latitude: 18.4735, longitude: -69.8843, blurb: "La primera ciudad de América: propiedades con historia, ideales para Airbnb y renta turística." },
  { slug: "mirador-sur", name: "Mirador Sur", type: LOCATION_TYPE.SECTOR, parentSlug: "santo-domingo-dn", latitude: 18.4436, longitude: -69.9375, blurb: "Frente al Parque Mirador Sur, con vistas y ambiente deportivo." },
  { slug: "arroyo-hondo", name: "Arroyo Hondo", type: LOCATION_TYPE.SECTOR, parentSlug: "santo-domingo-dn", latitude: 18.5033, longitude: -69.9525, blurb: "Residencial verde y familiar, con casas y torres de baja densidad." },
  { slug: "ensanche-julieta", name: "Ensanche Julieta", type: LOCATION_TYPE.SECTOR, parentSlug: "santo-domingo-dn", latitude: 18.4757, longitude: -69.9245, blurb: "Céntrico y bien conectado, con oferta de apartamentos de entrada." },

  // ─── Provincia Santo Domingo ──────────────────────────────────────────────
  {
    slug: "santo-domingo",
    name: "Provincia Santo Domingo",
    type: LOCATION_TYPE.PROVINCE,
    parentSlug: COUNTRY_SLUG,
    latitude: 18.5001,
    longitude: -69.8574,
    isFeatured: true,
    blurb: "El Gran Santo Domingo: Este, Norte y Oeste, con proyectos accesibles y crecimiento acelerado.",
  },
  { slug: "santo-domingo-este", name: "Santo Domingo Este", type: LOCATION_TYPE.MUNICIPALITY, parentSlug: "santo-domingo", latitude: 18.4886, longitude: -69.857, isFeatured: true, blurb: "El municipio más poblado del país: obra nueva a buen precio y cercanía a la playa de Boca Chica." },
  { slug: "san-isidro", name: "San Isidro", type: LOCATION_TYPE.SECTOR, parentSlug: "santo-domingo-este", latitude: 18.5017, longitude: -69.7517, blurb: "Zona de expansión con proyectos cerrados y áreas comunes." },
  { slug: "ozama", name: "Ozama / Alma Rosa", type: LOCATION_TYPE.SECTOR, parentSlug: "santo-domingo-este", latitude: 18.4833, longitude: -69.85, blurb: "Residencial consolidado y comercial, bien conectado al centro." },
  { slug: "santo-domingo-norte", name: "Santo Domingo Norte", type: LOCATION_TYPE.MUNICIPALITY, parentSlug: "santo-domingo", latitude: 18.5667, longitude: -69.9, isFeatured: true, blurb: "Villa Mella y alrededores: la opción más accesible para primera vivienda en el Gran Santo Domingo." },
  { slug: "santo-domingo-oeste", name: "Santo Domingo Oeste", type: LOCATION_TYPE.MUNICIPALITY, parentSlug: "santo-domingo", latitude: 18.4833, longitude: -70.0, isFeatured: true, blurb: "Herrera y Manoguayabo: industria, comercio y vivienda en crecimiento." },
  { slug: "boca-chica", name: "Boca Chica", type: LOCATION_TYPE.MUNICIPALITY, parentSlug: "santo-domingo", latitude: 18.4531, longitude: -69.6089, isFeatured: true, blurb: "Playa de aguas tranquilas a 30 minutos de la capital: casas y apartamentos para vacacionar o rentar." },

  // ─── Santiago ─────────────────────────────────────────────────────────────
  {
    slug: "santiago",
    name: "Santiago",
    type: LOCATION_TYPE.PROVINCE,
    parentSlug: COUNTRY_SLUG,
    latitude: 19.4517,
    longitude: -70.697,
    isFeatured: true,
    blurb: "La segunda ciudad del país y capital del Cibao: economía diversificada y mercado inmobiliario sólido.",
  },
  { slug: "santiago-de-los-caballeros", name: "Santiago de los Caballeros", type: LOCATION_TYPE.MUNICIPALITY, parentSlug: "santiago", latitude: 19.4517, longitude: -70.697, isFeatured: true, blurb: "Torres modernas, universidades y zona franca: fuerte demanda de alquiler y venta." },
  { slug: "jardines-metropolitanos", name: "Jardines Metropolitanos", type: LOCATION_TYPE.SECTOR, parentSlug: "santiago-de-los-caballeros", latitude: 19.4489, longitude: -70.6889, blurb: "El sector más exclusivo de Santiago, residencial y arbolado." },
  { slug: "la-trinitaria", name: "La Trinitaria", type: LOCATION_TYPE.SECTOR, parentSlug: "santiago-de-los-caballeros", latitude: 19.46, longitude: -70.68, blurb: "Zona céntrica de apartamentos, muy solicitada por profesionales." },
  { slug: "cerros-de-gurabo", name: "Cerros de Gurabo", type: LOCATION_TYPE.SECTOR, parentSlug: "santiago-de-los-caballeros", latitude: 19.44, longitude: -70.64, blurb: "Residenciales cerrados con vista, en expansión hacia Gurabo." },

  // ─── La Altagracia (Punta Cana / Bávaro / Cap Cana) ───────────────────────
  {
    slug: "la-altagracia",
    name: "La Altagracia",
    type: LOCATION_TYPE.PROVINCE,
    parentSlug: COUNTRY_SLUG,
    latitude: 18.5,
    longitude: -68.4,
    isFeatured: true,
    blurb: "El polo turístico #1 del Caribe: playas, campos de golf y la mayor rentabilidad de alquiler vacacional.",
  },
  { slug: "punta-cana", name: "Punta Cana", type: LOCATION_TYPE.MUNICIPALITY, parentSlug: "la-altagracia", latitude: 18.582, longitude: -68.4055, isFeatured: true, blurb: "Villas, apartamentos y proyectos frente al golf y a minutos de la playa. Ideal para invertir y para Airbnb." },
  { slug: "bavaro", name: "Bávaro", type: LOCATION_TYPE.SECTOR, parentSlug: "punta-cana", latitude: 18.6833, longitude: -68.4167, isFeatured: true, blurb: "El centro de la vida en Punta Cana: comercios, colegios y playas de bandera azul." },
  { slug: "cap-cana", name: "Cap Cana", type: LOCATION_TYPE.SECTOR, parentSlug: "punta-cana", latitude: 18.4667, longitude: -68.3833, isFeatured: true, blurb: "Comunidad cerrada de lujo con marina, golf Punta Espada y las villas más exclusivas del país." },
  { slug: "downtown-punta-cana", name: "Downtown Punta Cana", type: LOCATION_TYPE.SECTOR, parentSlug: "punta-cana", latitude: 18.582, longitude: -68.402, blurb: "El nuevo centro urbano de Punta Cana: uso mixto, oficinas y apartamentos." },
  { slug: "veron", name: "Verón", type: LOCATION_TYPE.SECTOR, parentSlug: "punta-cana", latitude: 18.62, longitude: -68.45, blurb: "Zona de mayor crecimiento y precios de entrada, a minutos de Bávaro." },
  { slug: "uvero-alto", name: "Uvero Alto", type: LOCATION_TYPE.SECTOR, parentSlug: "punta-cana", latitude: 18.85, longitude: -68.55, blurb: "Playas vírgenes y resorts al norte de Punta Cana, en desarrollo." },

  // ─── La Romana ────────────────────────────────────────────────────────────
  {
    slug: "la-romana",
    name: "La Romana",
    type: LOCATION_TYPE.PROVINCE,
    parentSlug: COUNTRY_SLUG,
    latitude: 18.4273,
    longitude: -68.9728,
    isFeatured: true,
    blurb: "Hogar de Casa de Campo, una de las comunidades residenciales de lujo más reconocidas del Caribe.",
  },
  { slug: "la-romana-ciudad", name: "La Romana (ciudad)", type: LOCATION_TYPE.MUNICIPALITY, parentSlug: "la-romana", latitude: 18.4273, longitude: -68.9728, blurb: "Ciudad con aeropuerto internacional, puerto de cruceros y demanda estable." },
  { slug: "casa-de-campo", name: "Casa de Campo", type: LOCATION_TYPE.SECTOR, parentSlug: "la-romana-ciudad", latitude: 18.42, longitude: -68.9, isFeatured: true, blurb: "Resort residencial con 3 campos de golf, marina y villas de lujo con servicio de clase mundial." },

  // ─── Puerto Plata ─────────────────────────────────────────────────────────
  {
    slug: "puerto-plata",
    name: "Puerto Plata",
    type: LOCATION_TYPE.PROVINCE,
    parentSlug: COUNTRY_SLUG,
    latitude: 19.7808,
    longitude: -70.6871,
    isFeatured: true,
    blurb: "La Novia del Atlántico: costa norte con teleférico, malecón renovado y precios competitivos.",
  },
  { slug: "puerto-plata-ciudad", name: "Puerto Plata (ciudad)", type: LOCATION_TYPE.MUNICIPALITY, parentSlug: "puerto-plata", latitude: 19.7808, longitude: -70.6871, blurb: "Ciudad victoriana frente al mar, con creciente inversión turística." },
  { slug: "cabarete", name: "Cabarete", type: LOCATION_TYPE.SECTOR, parentSlug: "puerto-plata-ciudad", latitude: 19.75, longitude: -70.4167, isFeatured: true, blurb: "Capital mundial del kitesurf: comunidad internacional y alta ocupación de alquiler." },
  { slug: "sosua", name: "Sosúa", type: LOCATION_TYPE.SECTOR, parentSlug: "puerto-plata-ciudad", latitude: 19.7539, longitude: -70.5197, blurb: "Bahía protegida y comunidad de expatriados, con oferta amplia de villas y condos." },

  // ─── Samaná ───────────────────────────────────────────────────────────────
  {
    slug: "samana",
    name: "Samaná",
    type: LOCATION_TYPE.PROVINCE,
    parentSlug: COUNTRY_SLUG,
    latitude: 19.2058,
    longitude: -69.3364,
    isFeatured: true,
    blurb: "Península de naturaleza intacta: cascadas, ballenas jorobadas y las playas más fotografiadas del país.",
  },
  { slug: "las-terrenas", name: "Las Terrenas", type: LOCATION_TYPE.MUNICIPALITY, parentSlug: "samana", latitude: 19.3133, longitude: -69.5417, isFeatured: true, blurb: "El pueblo playero más cosmopolita de RD: influencia europea, gastronomía y villas frente al mar." },
  { slug: "las-galeras", name: "Las Galeras", type: LOCATION_TYPE.SECTOR, parentSlug: "samana", latitude: 19.2833, longitude: -69.1667, blurb: "El extremo tranquilo de la península, para quienes buscan naturaleza y privacidad." },
  { slug: "samana-santa-barbara", name: "Santa Bárbara de Samaná", type: LOCATION_TYPE.MUNICIPALITY, parentSlug: "samana", latitude: 19.2058, longitude: -69.3364, blurb: "Capital provincial y punto de partida para el avistamiento de ballenas." },

  // ─── La Vega (Jarabacoa) ──────────────────────────────────────────────────
  {
    slug: "la-vega",
    name: "La Vega",
    type: LOCATION_TYPE.PROVINCE,
    parentSlug: COUNTRY_SLUG,
    latitude: 19.2225,
    longitude: -70.5294,
    blurb: "Provincia del Cibao y puerta de entrada a la montaña dominicana.",
  },
  { slug: "jarabacoa", name: "Jarabacoa", type: LOCATION_TYPE.MUNICIPALITY, parentSlug: "la-vega", latitude: 19.1197, longitude: -70.6297, isFeatured: true, blurb: "La ciudad de la eterna primavera: clima fresco, ríos y cabañas de montaña muy demandadas." },

  // ─── San Pedro de Macorís (Juan Dolio) ───────────────────────────────────
  {
    slug: "san-pedro-de-macoris",
    name: "San Pedro de Macorís",
    type: LOCATION_TYPE.PROVINCE,
    parentSlug: COUNTRY_SLUG,
    latitude: 18.4539,
    longitude: -69.3086,
    blurb: "Costa sureste a mitad de camino entre la capital y La Romana.",
  },
  { slug: "juan-dolio", name: "Juan Dolio", type: LOCATION_TYPE.MUNICIPALITY, parentSlug: "san-pedro-de-macoris", latitude: 18.4267, longitude: -69.4083, isFeatured: true, blurb: "La playa más cercana a Santo Domingo con proyectos de condo-hotel: ideal para inversión y segunda vivienda." },

  // ─── Espaillat (Jamao) / referencia costa norte extra ─────────────────────
  { slug: "cabrera", name: "Cabrera", type: LOCATION_TYPE.MUNICIPALITY, parentSlug: "maria-trinidad-sanchez", latitude: 19.6417, longitude: -69.9, blurb: "Acantilados sobre el Atlántico y lagunas, un secreto de la costa norte." },
  {
    slug: "maria-trinidad-sanchez",
    name: "María Trinidad Sánchez",
    type: LOCATION_TYPE.PROVINCE,
    parentSlug: COUNTRY_SLUG,
    latitude: 19.3833,
    longitude: -69.85,
    blurb: "Nagua y Cabrera: costa norte auténtica y en desarrollo temprano.",
  },
];

/** Ubicaciones destacadas para el bloque de "búsquedas rápidas" del home. */
export const FEATURED_LOCATIONS = LOCATIONS.filter((l) => l.isFeatured);

export const LOCATIONS_BY_SLUG: Record<string, LocationNode> = Object.fromEntries(
  LOCATIONS.map((l) => [l.slug, l]),
);

export function getLocationPath(slug: string): LocationNode[] {
  const path: LocationNode[] = [];
  let current: LocationNode | undefined = LOCATIONS_BY_SLUG[slug];
  while (current) {
    path.unshift(current);
    current = current.parentSlug ? LOCATIONS_BY_SLUG[current.parentSlug] : undefined;
  }
  return path;
}

export function getLocationChildren(slug: string): LocationNode[] {
  return LOCATIONS.filter((l) => l.parentSlug === slug);
}
