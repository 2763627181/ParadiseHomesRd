/**
 * Datos DEMO de Paradise Homes RD — dominicanos, realistas, ficticios.
 * Marcados con `isDemo: true`. Los usa:
 *   · `scripts/seed.ts` para poblar Supabase.
 *   · el modo demo de la web cuando no hay Supabase configurado.
 *
 * Producen los view models de `@paradise/types` directamente.
 */

import {
  CONDITION_STATUS,
  LOCATIONS,
  PROPERTY_CODE_PREFIX,
  PROPERTY_TYPE_LABELS,
  type ConditionStatus,
  type OperationType,
  type PropertyType,
} from "@paradise/config";
import { buildPropertySlug, formatPropertyCode } from "@paradise/utils";
import type {
  Agency,
  Agent,
  Developer,
  Project,
  Property,
  PropertySummary,
} from "@paradise/types";
import {
  AGENCY_LOGOS,
  AGENT_AVATARS,
  EXTERIOR_PHOTOS,
  INTERIOR_PHOTOS,
  PROJECT_PHOTOS,
  pickImages,
} from "./seed-images";

// ── PRNG determinista ──────────────────────────────────────────────────────
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260902);
const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)]!;
const between = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;
const daysAgoIso = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString();
const deaccent = (s: string) =>
  s.normalize("NFD").replace(/\p{Diacritic}/gu, "");
const nameToSlug = (s: string) => deaccent(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const locBySlug = Object.fromEntries(LOCATIONS.map((l) => [l.slug, l]));

/** UUID v4 determinista para datos demo: `00000000-0000-4000-8000-<ns><n(10)>`. */
const uuid = (ns: string, n: number): string =>
  `00000000-0000-4000-8000-${(ns + String(n).padStart(10, "0")).slice(-12)}`;

// ── Agencias ───────────────────────────────────────────────────────────────
const AGENCY_SPECS = [
  { name: "Caribbean Estates", slug: "caribbean-estates", city: "santo-domingo-dn", founded: 2014, verified: true },
  { name: "Atlántico Realty", slug: "atlantico-realty", city: "puerto-plata-ciudad", founded: 2011, verified: true },
  { name: "Piantini Living", slug: "piantini-living", city: "santo-domingo-dn", founded: 2018, verified: true },
  { name: "Punta Cana Homes Group", slug: "punta-cana-homes-group", city: "punta-cana", founded: 2009, verified: true },
  { name: "Cibao Propiedades", slug: "cibao-propiedades", city: "santiago-de-los-caballeros", founded: 2016, verified: false },
  { name: "Samaná Coast Realty", slug: "samana-coast-realty", city: "las-terrenas", founded: 2013, verified: true },
];

export const demoAgencies: Agency[] = AGENCY_SPECS.map((spec, i) => ({
  id: uuid("a1", i + 1),
  slug: spec.slug,
  name: spec.name,
  logoUrl: AGENCY_LOGOS[i % AGENCY_LOGOS.length]!,
  coverImageUrl: EXTERIOR_PHOTOS[i % EXTERIOR_PHOTOS.length]!,
  isVerified: spec.verified,
  city: locBySlug[spec.city]?.name ?? null,
  activeListings: 0,
  projectCount: 0,
  agentCount: 0,
  description: `${spec.name} es una firma inmobiliaria dominicana con enfoque en asesoría transparente y propiedades verificadas. Operamos principalmente en ${locBySlug[spec.city]?.name ?? "República Dominicana"} y zonas cercanas.`,
  website: `https://${spec.slug.replace(/-/g, "")}.com.do`,
  phone: `809${between(2000000, 9999999)}`,
  whatsapp: `1809${between(2000000, 9999999)}`,
  email: `info@${spec.slug.replace(/-/g, "")}.com.do`,
  areas: [locBySlug[spec.city]?.name ?? "Santo Domingo"],
  socialLinks: { instagram: `https://instagram.com/${spec.slug.replace(/-/g, "")}` },
  foundedYear: spec.founded,
  createdAt: daysAgoIso(400 + i * 20),
}));

// ── Desarrolladoras ────────────────────────────────────────────────────────
export const demoDevelopers: Developer[] = [
  {
    id: uuid("d1", 1),
    slug: "grupo-lumina",
    name: "Grupo Lumina",
    logoUrl: AGENCY_LOGOS[0]!,
    coverImageUrl: PROJECT_PHOTOS[0]!,
    isVerified: true,
    projectCount: 0,
    deliveredUnits: 640,
    description:
      "Desarrolladora dominicana con más de 12 años entregando proyectos residenciales de uso mixto en el Distrito Nacional y la zona este.",
    website: "https://grupolumina.do",
    phone: "8095551200",
    whatsapp: "18095551200",
    foundedYear: 2012,
    areas: ["Distrito Nacional", "Punta Cana", "Santiago"],
  },
  {
    id: uuid("d1", 2),
    slug: "costa-este-development",
    name: "Costa Este Development",
    logoUrl: AGENCY_LOGOS[1]!,
    coverImageUrl: PROJECT_PHOTOS[1]!,
    isVerified: true,
    projectCount: 0,
    deliveredUnits: 310,
    description:
      "Especialistas en proyectos frente al mar y condo-hoteles en la costa este y Samaná.",
    website: "https://costaeste.do",
    phone: "8095559800",
    whatsapp: "18095559800",
    foundedYear: 2015,
    areas: ["Punta Cana", "Juan Dolio", "Las Terrenas"],
  },
];

// ── Agentes ────────────────────────────────────────────────────────────────
const AGENT_NAMES = [
  "María Gómez",
  "Carlos Peña",
  "Luisa Fernández",
  "José Ramírez",
  "Paola Disla",
  "Andrés Batista",
  "Camila Rosario",
  "Fernando Then",
  "Gabriela Núñez",
  "Ricardo Espaillat",
  "Isabela Cruz",
  "Héctor Guzmán",
];

export const demoAgents: Agent[] = AGENT_NAMES.map((name, i) => {
  const agency = demoAgencies[i % demoAgencies.length]!;
  const slug = nameToSlug(name);
  const rating = Number((4.2 + rand() * 0.8).toFixed(1));
  return {
    id: uuid("b1", i + 1),
    slug,
    fullName: name,
    avatarUrl: AGENT_AVATARS[i % AGENT_AVATARS.length]!,
    title: pick(["Asesor inmobiliario", "Broker asociado", "Especialista en zona", "Consultor senior"]),
    isVerified: i % 4 !== 0,
    agencyName: agency.name,
    agencySlug: agency.slug,
    whatsapp: `1809${between(2000000, 9999999)}`,
    phone: `809${between(2000000, 9999999)}`,
    responseTimeMinutes: pick([8, 12, 15, 22, 35, 45]),
    languages: i % 3 === 0 ? ["Español", "English"] : ["Español"],
    areas: [pick(LOCATIONS.filter((l) => l.type === "SECTOR")).name, pick(LOCATIONS.filter((l) => l.type === "MUNICIPALITY")).name],
    activeListings: 0,
    ratingAverage: rating > 5 ? 5 : rating,
    ratingCount: between(3, 48),
    bio: `${name} acompaña a compradores e inversionistas en República Dominicana con un enfoque cercano y basado en datos. ${i % 2 === 0 ? "Experiencia en obra nueva y preventa." : "Especializado en reventa y alquiler premium."}`,
    email: `${slug}@${agency.slug.replace(/-/g, "")}.com.do`,
    coverImageUrl: EXTERIOR_PHOTOS[i % EXTERIOR_PHOTOS.length]!,
    yearsExperience: between(2, 15),
    socialLinks: { instagram: `https://instagram.com/${slug}.rd` },
    joinedAt: daysAgoIso(between(120, 900)),
  };
});

// ── Propiedades ────────────────────────────────────────────────────────────
interface PropSpec {
  type: PropertyType;
  op: OperationType;
  sector: string;
  title: string;
  price: number;
  currency: "USD" | "DOP";
  beds: number;
  baths: number;
  parking: number;
  m2: number;
  condition: ConditionStatus;
  amenities: string[];
  featured?: boolean;
  verified?: boolean;
}

const P: PropSpec[] = [
  { type: "APARTMENT", op: "SALE", sector: "piantini", title: "Apartamento contemporáneo en Piantini", price: 285000, currency: "USD", beds: 3, baths: 3.5, parking: 2, m2: 175, condition: "READY_TO_MOVE", amenities: ["pool", "gym", "security_24_7", "elevator", "power_plant_full"], featured: true, verified: true },
  { type: "PENTHOUSE", op: "SALE", sector: "naco", title: "Penthouse con terraza privada en Naco", price: 545000, currency: "USD", beds: 3, baths: 4, parking: 3, m2: 320, condition: "NEW", amenities: ["pool", "gym", "security_24_7", "elevator", "rooftop", "power_plant_full", "city_view"], featured: true, verified: true },
  { type: "APARTMENT", op: "SALE", sector: "evaristo-morales", title: "Apartamento moderno en Evaristo Morales", price: 168000, currency: "USD", beds: 2, baths: 2.5, parking: 1, m2: 112, condition: "OFF_PLAN", amenities: ["gym", "security_24_7", "elevator", "coworking", "airbnb_friendly"], verified: true },
  { type: "APARTMENT", op: "RENT", sector: "serralles", title: "Apartamento amueblado en Serrallés", price: 1850, currency: "USD", beds: 2, baths: 2, parking: 1, m2: 118, condition: "USED", amenities: ["pool", "gym", "security_24_7", "furnished", "elevator", "pet_friendly"], verified: true },
  { type: "APARTMENT", op: "SALE", sector: "bella-vista", title: "Apartamento familiar cerca del Malecón", price: 9_800_000, currency: "DOP", beds: 3, baths: 2.5, parking: 2, m2: 148, condition: "USED", amenities: ["security_24_7", "elevator", "power_plant", "kids_area"] },
  { type: "VILLA", op: "SALE", sector: "cap-cana", title: "Villa frente al golf en Cap Cana", price: 1_250_000, currency: "USD", beds: 4, baths: 5, parking: 3, m2: 480, condition: "READY_TO_MOVE", amenities: ["private_pool", "gated_community", "golf_access", "security_24_7", "garden", "ocean_view"], featured: true, verified: true },
  { type: "VILLA", op: "SALE", sector: "punta-cana", title: "Villa de 3 habitaciones en comunidad cerrada", price: 395000, currency: "USD", beds: 3, baths: 3.5, parking: 2, m2: 260, condition: "NEW", amenities: ["private_pool", "gated_community", "security_24_7", "garden", "airbnb_friendly"], verified: true },
  { type: "APARTMENT", op: "SALE", sector: "bavaro", title: "Apartamento con piscina a 5 min de la playa", price: 139000, currency: "USD", beds: 2, baths: 2, parking: 1, m2: 96, condition: "OFF_PLAN", amenities: ["pool", "security_24_7", "elevator", "airbnb_friendly", "club_house"], featured: true },
  { type: "VILLA", op: "RENT", sector: "cap-cana", title: "Villa de lujo para renta vacacional en Cap Cana", price: 6500, currency: "USD", beds: 5, baths: 6, parking: 4, m2: 620, condition: "READY_TO_MOVE", amenities: ["private_pool", "gated_community", "golf_access", "furnished", "ocean_view", "short_term_ok"], verified: true },
  { type: "APARTMENT", op: "SALE", sector: "las-terrenas", title: "Apartamento a pasos de Playa Las Ballenas", price: 215000, currency: "USD", beds: 2, baths: 2, parking: 1, m2: 105, condition: "NEW", amenities: ["pool", "security_24_7", "beachfront", "airbnb_friendly", "furnished"], featured: true, verified: true },
  { type: "HOUSE", op: "SALE", sector: "las-terrenas", title: "Casa caribeña con jardín tropical", price: 320000, currency: "USD", beds: 3, baths: 3, parking: 2, m2: 240, condition: "USED", amenities: ["private_pool", "garden", "pet_friendly", "gated_community"] },
  { type: "APARTMENT", op: "SALE", sector: "jardines-metropolitanos", title: "Apartamento en torre nueva, Jardines Metropolitanos", price: 12_500_000, currency: "DOP", beds: 3, baths: 3, parking: 2, m2: 165, condition: "NEW", amenities: ["gym", "security_24_7", "elevator", "power_plant_full", "rooftop"], verified: true },
  { type: "APARTMENT", op: "RENT", sector: "la-trinitaria", title: "Apartamento moderno en La Trinitaria, Santiago", price: 45000, currency: "DOP", beds: 2, baths: 2, parking: 1, m2: 92, condition: "USED", amenities: ["security_24_7", "elevator", "power_plant", "furnished"] },
  { type: "HOUSE", op: "SALE", sector: "cerros-de-gurabo", title: "Casa en residencial cerrado, Cerros de Gurabo", price: 245000, currency: "USD", beds: 4, baths: 3.5, parking: 3, m2: 310, condition: "READY_TO_MOVE", amenities: ["gated_community", "security_24_7", "garden", "kids_area", "club_house"], verified: true },
  { type: "APARTMENT", op: "SALE", sector: "juan-dolio", title: "Condo frente al mar en Juan Dolio", price: 178000, currency: "USD", beds: 1, baths: 1.5, parking: 1, m2: 78, condition: "OFF_PLAN", amenities: ["pool", "beachfront", "security_24_7", "airbnb_friendly", "gym"], featured: true },
  { type: "APARTMENT", op: "SALE", sector: "los-cacicazgos", title: "Apartamento de línea en Los Cacicazgos", price: 410000, currency: "USD", beds: 3, baths: 3.5, parking: 2, m2: 210, condition: "USED", amenities: ["pool", "gym", "security_24_7", "elevator", "power_plant_full"], verified: true },
  { type: "OFFICE", op: "RENT", sector: "piantini", title: "Oficina en torre corporativa de Piantini", price: 2400, currency: "USD", beds: 0, baths: 2, parking: 3, m2: 140, condition: "READY_TO_MOVE", amenities: ["security_24_7", "elevator", "power_plant_full", "visitor_parking"] },
  { type: "LOT", op: "SALE", sector: "cabrera", title: "Solar con vista al acantilado en Cabrera", price: 95000, currency: "USD", beds: 0, baths: 0, parking: 0, m2: 1200, condition: "NEW", amenities: ["ocean_view", "gated_community"] },
  { type: "HOUSE", op: "SALE", sector: "arroyo-hondo", title: "Casa amplia en Arroyo Hondo Viejo", price: 18_500_000, currency: "DOP", beds: 4, baths: 4, parking: 4, m2: 420, condition: "USED", amenities: ["garden", "yard", "security_24_7", "power_plant_full", "pet_friendly"] },
  { type: "APARTMENT", op: "RENT", sector: "gazcue", title: "Apartamento con encanto en Gazcue", price: 850, currency: "USD", beds: 2, baths: 1, parking: 1, m2: 84, condition: "USED", amenities: ["furnished", "pet_friendly", "balcony"] },
  { type: "APARTMENT", op: "SALE", sector: "zona-colonial", title: "Loft restaurado en la Zona Colonial", price: 240000, currency: "USD", beds: 1, baths: 1.5, parking: 0, m2: 90, condition: "USED", amenities: ["airbnb_friendly", "furnished", "city_view"], featured: true, verified: true },
  { type: "VILLA", op: "SALE", sector: "casa-de-campo", title: "Villa de golf en Casa de Campo", price: 2_400_000, currency: "USD", beds: 5, baths: 6, parking: 4, m2: 720, condition: "READY_TO_MOVE", amenities: ["private_pool", "gated_community", "golf_access", "marina_access", "security_24_7", "garden"], featured: true, verified: true },
  { type: "APARTMENT", op: "SALE", sector: "cabarete", title: "Apartamento a 2 min de Kite Beach", price: 165000, currency: "USD", beds: 2, baths: 2, parking: 1, m2: 98, condition: "NEW", amenities: ["pool", "beachfront", "airbnb_friendly", "furnished"], verified: true },
  { type: "HOUSE", op: "RENT", sector: "sosua", title: "Casa con piscina en Sosúa", price: 1400, currency: "USD", beds: 3, baths: 2.5, parking: 2, m2: 220, condition: "USED", amenities: ["private_pool", "garden", "gated_community", "pet_friendly", "furnished"] },
  { type: "APARTMENT", op: "SALE", sector: "downtown-punta-cana", title: "Apartamento en Downtown Punta Cana", price: 189000, currency: "USD", beds: 2, baths: 2, parking: 1, m2: 102, condition: "OFF_PLAN", amenities: ["pool", "gym", "security_24_7", "coworking", "airbnb_friendly"], verified: true },
  { type: "PENTHOUSE", op: "SALE", sector: "bella-vista", title: "Penthouse dúplex con vista abierta", price: 375000, currency: "USD", beds: 3, baths: 3.5, parking: 2, m2: 245, condition: "NEW", amenities: ["gym", "security_24_7", "elevator", "rooftop", "city_view", "power_plant_full"] },
  { type: "COMMERCIAL", op: "RENT", sector: "naco", title: "Local comercial en avenida principal de Naco", price: 3200, currency: "USD", beds: 0, baths: 1, parking: 2, m2: 180, condition: "READY_TO_MOVE", amenities: ["security_24_7", "power_plant", "visitor_parking"] },
  { type: "HOUSE", op: "SALE", sector: "san-isidro", title: "Casa nueva en proyecto cerrado, San Isidro", price: 7_900_000, currency: "DOP", beds: 3, baths: 2.5, parking: 2, m2: 165, condition: "NEW", amenities: ["gated_community", "security_24_7", "kids_area", "club_house"], featured: true },
  { type: "APARTMENT", op: "SALE", sector: "jarabacoa", title: "Apartamento de montaña en Jarabacoa", price: 135000, currency: "USD", beds: 2, baths: 2, parking: 1, m2: 110, condition: "NEW", amenities: ["mountain_view", "security_24_7", "gated_community"] },
  { type: "VILLA", op: "SALE", sector: "las-galeras", title: "Villa ecológica en Las Galeras", price: 285000, currency: "USD", beds: 3, baths: 3, parking: 2, m2: 200, condition: "NEW", amenities: ["private_pool", "ocean_view", "garden", "pet_friendly"] },
  { type: "APARTMENT", op: "RENT", sector: "evaristo-morales", title: "Estudio ejecutivo en Evaristo Morales", price: 720, currency: "USD", beds: 0, baths: 1, parking: 1, m2: 46, condition: "NEW", amenities: ["furnished", "gym", "security_24_7", "elevator", "coworking"] },
  { type: "APARTMENT", op: "SALE", sector: "piantini", title: "Apartamento de 2 habitaciones listo para entrega", price: 235000, currency: "USD", beds: 2, baths: 2.5, parking: 2, m2: 128, condition: "READY_TO_MOVE", amenities: ["pool", "gym", "security_24_7", "elevator", "power_plant_full", "pet_friendly"], verified: true },
];

function conditionLabel(c: ConditionStatus): string {
  return {
    [CONDITION_STATUS.NEW]: "Nuevo",
    [CONDITION_STATUS.USED]: "Usado",
    [CONDITION_STATUS.OFF_PLAN]: "En planos",
    [CONDITION_STATUS.UNDER_CONSTRUCTION]: "En construcción",
    [CONDITION_STATUS.READY_TO_MOVE]: "Listo para entrega",
  }[c];
}

export const demoProperties: Property[] = P.map((spec, i) => {
  const seq = i + 1;
  const code = formatPropertyCode(PROPERTY_CODE_PREFIX[spec.type], seq);
  const sector = locBySlug[spec.sector]!;
  const city = sector.parentSlug ? locBySlug[sector.parentSlug] : undefined;
  const province = city?.parentSlug ? locBySlug[city.parentSlug] : undefined;
  const agent = demoAgents[i % demoAgents.length]!;
  const agency = demoAgencies.find((a) => a.slug === agent.agencySlug)!;
  const imageCount = between(6, 12);
  const photos = [
    ...pickImages(EXTERIOR_PHOTOS, i, 2),
    ...pickImages(INTERIOR_PHOTOS, i + 1, imageCount - 2),
  ];
  const slug = buildPropertySlug({
    propertyTypeLabel: PROPERTY_TYPE_LABELS[spec.type],
    bedrooms: spec.beds,
    sector: sector.name,
    code,
  });
  const publishedDaysAgo = between(1, 55);
  const jitter = (base: number) => base + (rand() - 0.5) * 0.01;

  return {
    id: uuid("f1", seq),
    code,
    slug,
    title: spec.title,
    description: `${spec.title}. ${conditionLabel(spec.condition)}. Ubicado en ${sector.name}${city ? `, ${city.name}` : ""}, este ${PROPERTY_TYPE_LABELS[spec.type].toLowerCase()} ofrece ${spec.beds > 0 ? `${spec.beds} habitaciones, ` : ""}${spec.baths} baños y ${spec.m2} m² de ${spec.type === "LOT" || spec.type === "LAND" ? "terreno" : "construcción"}. Excelente distribución, acabados de calidad y una ubicación con alta demanda. Ideal para ${spec.op === "RENT" ? "mudarte de inmediato" : spec.amenities.includes("airbnb_friendly") ? "vivir o generar renta con Airbnb" : "vivir o invertir"}.\n\nEsta es una publicación DEMO de Paradise Homes RD.`,
    operationType: spec.op,
    propertyType: spec.type,
    conditionStatus: spec.condition,
    price: {
      amount: spec.price,
      currency: spec.currency,
      onRequest: false,
      period: spec.op === "RENT" ? "month" : null,
    },
    bedrooms: spec.beds,
    bathrooms: spec.baths,
    parkingSpaces: spec.parking,
    constructionM2: spec.type === "LOT" || spec.type === "LAND" ? null : spec.m2,
    landM2: spec.type === "LOT" || spec.type === "LAND" ? spec.m2 : spec.type === "VILLA" || spec.type === "HOUSE" ? Math.round(spec.m2 * 1.6) : null,
    coverImage: {
      id: uuid("f2", seq * 100),
      url: photos[0]!,
      position: 0,
      isCover: true,
      alt: spec.title,
      width: 1280,
      height: 854,
    },
    imageCount: photos.length,
    images: photos.map((url, p) => ({
      id: uuid("f2", seq * 100 + p),
      url,
      position: p,
      isCover: p === 0,
      alt: `${spec.title} — foto ${p + 1}`,
      width: 1280,
      height: 854,
    })),
    video: i % 5 === 0 ? { provider: "youtube", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", title: "Recorrido virtual" } : null,
    virtualTourUrl: null,
    location: {
      address: spec.type === "LOT" ? `${sector.name}, ${city?.name ?? ""}` : `Calle ${between(1, 40)}, ${sector.name}`,
      sector: sector.name,
      sectorSlug: sector.slug,
      city: city?.name ?? null,
      citySlug: city?.slug ?? null,
      province: province?.name ?? city?.name ?? null,
      provinceSlug: province?.slug ?? null,
      country: "República Dominicana",
      latitude: jitter(sector.latitude),
      longitude: jitter(sector.longitude),
      hideExactLocation: spec.op === "SALE" && spec.price > 800000,
    },
    features: spec.amenities.map((key) => ({
      key,
      label: key,
      value: true,
      group: "edificio",
    })),
    amenityKeys: spec.amenities,
    maintenanceFee:
      spec.type === "APARTMENT" || spec.type === "PENTHOUSE" || spec.type === "OFFICE"
        ? { amount: between(80, 320), currency: "USD", period: "month" }
        : null,
    yearBuilt: spec.condition === "USED" ? between(2005, 2020) : spec.condition === "READY_TO_MOVE" ? 2025 : null,
    floor: spec.type === "APARTMENT" ? between(2, 18) : spec.type === "PENTHOUSE" ? between(15, 24) : null,
    totalFloors: spec.type === "APARTMENT" || spec.type === "PENTHOUSE" ? between(12, 26) : null,
    furnished: spec.amenities.includes("furnished"),
    petFriendly: spec.amenities.includes("pet_friendly"),
    airbnbFriendly: spec.amenities.includes("airbnb_friendly"),
    deliveryDate:
      spec.condition === "OFF_PLAN" || spec.condition === "UNDER_CONSTRUCTION"
        ? new Date(Date.now() + between(180, 720) * 86_400_000).toISOString()
        : null,
    project: null,
    projectId: null,
    status: "PUBLISHED",
    isVerified: Boolean(spec.verified),
    isFeatured: Boolean(spec.featured),
    isNew: publishedDaysAgo <= 10,
    agent: {
      id: agent.id,
      slug: agent.slug,
      fullName: agent.fullName,
      avatarUrl: agent.avatarUrl,
      title: agent.title,
      isVerified: agent.isVerified,
      agencyName: agent.agencyName,
      agencySlug: agent.agencySlug,
      whatsapp: agent.whatsapp,
      phone: agent.phone,
      responseTimeMinutes: agent.responseTimeMinutes,
      languages: agent.languages,
      areas: agent.areas,
      activeListings: agent.activeListings,
      ratingAverage: agent.ratingAverage,
      ratingCount: agent.ratingCount,
    },
    agency: {
      id: agency.id,
      slug: agency.slug,
      name: agency.name,
      logoUrl: agency.logoUrl,
      isVerified: agency.isVerified,
      city: agency.city,
      activeListings: agency.activeListings,
      projectCount: agency.projectCount,
      agentCount: agency.agentCount,
    },
    priceHistory:
      i % 3 === 0
        ? [
            { price: Math.round(spec.price * 1.06), currency: spec.currency, changedAt: daysAgoIso(publishedDaysAgo + 20) },
            { price: spec.price, currency: spec.currency, changedAt: daysAgoIso(between(1, 8)) },
          ]
        : [{ price: spec.price, currency: spec.currency, changedAt: daysAgoIso(publishedDaysAgo) }],
    isDemo: true,
    createdAt: daysAgoIso(publishedDaysAgo + 2),
    updatedAt: daysAgoIso(between(0, publishedDaysAgo)),
    publishedAt: daysAgoIso(publishedDaysAgo),
    lastVerifiedAt: daysAgoIso(between(0, 26)),
    viewCount: between(40, 2400),
    favoriteCount: between(0, 120),
  } satisfies Property;
});

export const demoPropertySummaries: PropertySummary[] = demoProperties.map((p) => ({
  id: p.id,
  code: p.code,
  slug: p.slug,
  title: p.title,
  operationType: p.operationType,
  propertyType: p.propertyType,
  conditionStatus: p.conditionStatus,
  price: p.price,
  bedrooms: p.bedrooms,
  bathrooms: p.bathrooms,
  parkingSpaces: p.parkingSpaces,
  constructionM2: p.constructionM2,
  landM2: p.landM2,
  coverImage: p.coverImage,
  imageCount: p.imageCount,
  location: {
    sector: p.location.sector,
    sectorSlug: p.location.sectorSlug,
    city: p.location.city,
    citySlug: p.location.citySlug,
    province: p.location.province,
    latitude: p.location.hideExactLocation ? roundCoord(p.location.latitude) : p.location.latitude,
    longitude: p.location.hideExactLocation ? roundCoord(p.location.longitude) : p.location.longitude,
  },
  isVerified: p.isVerified,
  isFeatured: p.isFeatured,
  isNew: p.isNew,
  agency: p.agency
    ? { id: p.agency.id, name: p.agency.name, slug: p.agency.slug, logoUrl: p.agency.logoUrl, isVerified: p.agency.isVerified }
    : null,
  agent: p.agent
    ? { id: p.agent.id, slug: p.agent.slug, fullName: p.agent.fullName, avatarUrl: p.agent.avatarUrl, isVerified: p.agent.isVerified }
    : null,
  projectId: p.project?.id ?? null,
  publishedAt: p.publishedAt,
  lastVerifiedAt: p.lastVerifiedAt,
}));

function roundCoord(v: number | null): number | null {
  return v == null ? null : Math.round(v * 200) / 200;
}

// ── Proyectos ──────────────────────────────────────────────────────────────
export const demoProjects: Project[] = [
  buildProject(1, {
    name: "Lumina Piantini",
    slug: "lumina-piantini",
    developer: demoDevelopers[0]!,
    sector: "piantini",
    status: "UNDER_CONSTRUCTION",
    priceFrom: 189000,
    priceTo: 640000,
    beds: [1, 3],
    amenities: ["pool", "gym", "security_24_7", "elevator", "rooftop", "coworking", "power_plant_full", "kids_area"],
    towers: ["Torre Norte", "Torre Sur"],
    unitsPerTower: 8,
    featured: true,
  }),
  buildProject(2, {
    name: "Costa Este Residences",
    slug: "costa-este-residences",
    developer: demoDevelopers[1]!,
    sector: "bavaro",
    status: "PRE_SALE",
    priceFrom: 129000,
    priceTo: 320000,
    beds: [1, 3],
    amenities: ["pool", "beachfront", "security_24_7", "club_house", "airbnb_friendly", "gym", "kids_area"],
    towers: ["Bloque A", "Bloque B", "Bloque C"],
    unitsPerTower: 6,
    featured: true,
  }),
  buildProject(3, {
    name: "Altos de Gurabo",
    slug: "altos-de-gurabo",
    developer: demoDevelopers[0]!,
    sector: "cerros-de-gurabo",
    status: "READY",
    priceFrom: 165000,
    priceTo: 295000,
    beds: [2, 3],
    amenities: ["gated_community", "security_24_7", "club_house", "kids_area", "garden"],
    towers: ["Etapa 1"],
    unitsPerTower: 10,
  }),
  buildProject(4, {
    name: "Samaná Blue",
    slug: "samana-blue",
    developer: demoDevelopers[1]!,
    sector: "las-terrenas",
    status: "UNDER_CONSTRUCTION",
    priceFrom: 175000,
    priceTo: 450000,
    beds: [1, 3],
    amenities: ["pool", "beachfront", "ocean_view", "security_24_7", "airbnb_friendly", "rooftop"],
    towers: ["Ala Este", "Ala Oeste"],
    unitsPerTower: 7,
    featured: true,
  }),
];

interface ProjectSpec {
  name: string;
  slug: string;
  developer: Developer;
  sector: string;
  status: Project["status"];
  priceFrom: number;
  priceTo: number;
  beds: [number, number];
  amenities: string[];
  towers: string[];
  unitsPerTower: number;
  featured?: boolean;
}

function buildProject(seq: number, spec: ProjectSpec): Project {
  const sector = locBySlug[spec.sector]!;
  const city = sector.parentSlug ? locBySlug[sector.parentSlug] : undefined;
  const province = city?.parentSlug ? locBySlug[city.parentSlug] : undefined;
  const code = `PH-PRJ-${String(seq).padStart(5, "0")}`;
  const photos = pickImages(PROJECT_PHOTOS, seq, 8);
  const buildings = spec.towers.map((name, b) => ({
    id: uuid("e2", seq * 10 + b),
    name,
    position: b,
    floors: between(6, 14),
    unitCount: spec.unitsPerTower,
  }));
  const buildingLetters = ["A", "B", "C", "D", "E", "F", "G", "H"];
  const units = buildings.flatMap((building, b) =>
    Array.from({ length: spec.unitsPerTower }, (_, u) => {
      const level = Math.floor(u / 2) + 2;
      const beds = between(spec.beds[0], spec.beds[1]);
      const area = 55 + beds * 28 + between(-6, 12);
      const price = Math.round((spec.priceFrom + (spec.priceTo - spec.priceFrom) * rand()) / 1000) * 1000;
      const statusRoll = rand();
      // La letra viene de la posición del edificio (no del nombre) para garantizar
      // unicidad de `code` por proyecto: la constraint es (project_id, code).
      const letter = buildingLetters[b] ?? `X${b + 1}`;
      const label = `${letter}${level}${String(u + 1).padStart(2, "0")}`;
      return {
        id: uuid("e3", seq * 1000 + b * 100 + u),
        code: `${code}-${label}`,
        buildingId: building.id,
        buildingName: building.name,
        label,
        level,
        unitType: "APARTMENT" as const,
        bedrooms: beds,
        bathrooms: beds === 1 ? 1.5 : beds,
        areaM2: area,
        price,
        currency: "USD" as const,
        status:
          statusRoll > 0.75 ? ("SOLD" as const) : statusRoll > 0.6 ? ("RESERVED" as const) : ("AVAILABLE" as const),
        floorPlanUrl: null,
      };
    }),
  );
  const available = units.filter((u) => u.status === "AVAILABLE").length;

  return {
    id: uuid("e1", seq),
    code,
    slug: spec.slug,
    name: spec.name,
    status: spec.status,
    coverImage: { id: uuid("e4", seq), url: photos[0]!, position: 0, isCover: true, alt: spec.name, width: 1280, height: 854 },
    location: {
      address: `${sector.name}, ${city?.name ?? ""}`,
      sector: sector.name,
      sectorSlug: sector.slug,
      city: city?.name ?? null,
      citySlug: city?.slug ?? null,
      province: province?.name ?? null,
      provinceSlug: province?.slug ?? null,
      country: "República Dominicana",
      latitude: sector.latitude,
      longitude: sector.longitude,
      hideExactLocation: false,
    },
    priceFrom: { amount: spec.priceFrom, currency: "USD", onRequest: false, period: null },
    priceTo: { amount: spec.priceTo, currency: "USD", onRequest: false, period: null },
    deliveryEstimate:
      spec.status === "READY" || spec.status === "DELIVERED"
        ? null
        : new Date(Date.now() + between(120, 900) * 86_400_000).toISOString(),
    bedroomsRange: spec.beds,
    availableUnits: available,
    totalUnits: units.length,
    developer: {
      id: spec.developer.id,
      name: spec.developer.name,
      slug: spec.developer.slug,
      logoUrl: spec.developer.logoUrl,
      isVerified: spec.developer.isVerified,
      projectCount: spec.developer.projectCount,
      deliveredUnits: spec.developer.deliveredUnits,
      description: spec.developer.description,
      coverImageUrl: spec.developer.coverImageUrl,
      website: spec.developer.website,
      phone: spec.developer.phone,
      whatsapp: spec.developer.whatsapp,
      foundedYear: spec.developer.foundedYear,
      areas: spec.developer.areas,
    },
    isVerified: true,
    isFeatured: Boolean(spec.featured),
    description: `${spec.name} es un desarrollo de ${spec.developer.name} en ${sector.name}. ${spec.towers.length} ${spec.towers.length === 1 ? "etapa" : "torres/bloques"}, ${units.length} unidades de ${spec.beds[0]} a ${spec.beds[1]} habitaciones, con amenidades completas y planes de pago flexibles durante la construcción.\n\nProyecto DEMO de Paradise Homes RD.`,
    images: photos.map((url, p) => ({ id: uuid("e4", seq * 100 + p), url, position: p, isCover: p === 0, alt: `${spec.name} — ${p + 1}`, width: 1280, height: 854 })),
    video: null,
    masterplanUrl: null,
    amenityKeys: spec.amenities,
    buildings,
    units,
    paymentPlans: [
      {
        id: uuid("e5", seq),
        name: "Plan preventa",
        separationAmount: { amount: 5000, currency: "USD", onRequest: false, period: null },
        downPaymentPct: 20,
        duringConstructionPct: 30,
        onDeliveryPct: 50,
        notes: "Separación de US$5,000. 20% de inicial, 30% en cuotas durante construcción, 50% contra entrega o vía financiamiento bancario.",
        isDefault: true,
      },
    ],
    deliveredUnits: spec.status === "DELIVERED" ? units.length : 0,
    isDemo: true,
    createdAt: daysAgoIso(between(60, 300)),
    updatedAt: daysAgoIso(between(0, 30)),
  } satisfies Project;
}

// Enlazar conteos
for (const agency of demoAgencies) {
  agency.activeListings = demoProperties.filter((p) => p.agency?.slug === agency.slug).length;
  agency.agentCount = demoAgents.filter((a) => a.agencySlug === agency.slug).length;
  agency.projectCount = 0;
}
for (const agent of demoAgents) {
  agent.activeListings = demoProperties.filter((p) => p.agent?.slug === agent.slug).length;
}
for (const dev of demoDevelopers) {
  dev.projectCount = demoProjects.filter((p) => p.developer?.slug === dev.slug).length;
}

export const DEMO_SUMMARY = {
  agencies: demoAgencies.length,
  developers: demoDevelopers.length,
  agents: demoAgents.length,
  properties: demoProperties.length,
  projects: demoProjects.length,
  units: demoProjects.reduce((n, p) => n + p.units.length, 0),
};
