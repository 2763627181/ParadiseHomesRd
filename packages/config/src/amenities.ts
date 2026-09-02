/**
 * Características y amenidades de propiedades/proyectos.
 * `key` es estable y se guarda en `property_features.key` / `project_amenities.key`.
 * `group` organiza el panel de filtros y la sección de amenidades del detalle.
 */

export type AmenityGroup = "interior" | "edificio" | "exterior" | "ubicacion" | "uso";

export interface Amenity {
  key: string;
  label: string;
  /** lucide-react icon name */
  icon: string;
  group: AmenityGroup;
  /** se muestra como filtro destacado */
  isPrimaryFilter?: boolean;
}

export const AMENITIES: Amenity[] = [
  // Interior
  { key: "furnished", label: "Amueblado", icon: "Sofa", group: "interior", isPrimaryFilter: true },
  { key: "balcony", label: "Balcón", icon: "Fence", group: "interior" },
  { key: "terrace", label: "Terraza", icon: "Umbrella", group: "interior" },
  { key: "walk_in_closet", label: "Walk-in closet", icon: "Shirt", group: "interior" },
  { key: "maid_room", label: "Habitación de servicio", icon: "BedSingle", group: "interior" },
  { key: "laundry_area", label: "Área de lavado", icon: "WashingMachine", group: "interior" },
  { key: "ac_installed", label: "Aire acondicionado instalado", icon: "AirVent", group: "interior" },
  { key: "kitchen_equipped", label: "Cocina equipada", icon: "CookingPot", group: "interior" },

  // Edificio / proyecto
  { key: "pool", label: "Piscina", icon: "Waves", group: "edificio", isPrimaryFilter: true },
  { key: "gym", label: "Gimnasio", icon: "Dumbbell", group: "edificio", isPrimaryFilter: true },
  { key: "security_24_7", label: "Seguridad 24/7", icon: "ShieldCheck", group: "edificio", isPrimaryFilter: true },
  { key: "elevator", label: "Ascensor", icon: "ArrowUpDown", group: "edificio", isPrimaryFilter: true },
  { key: "power_plant", label: "Planta eléctrica", icon: "Zap", group: "edificio", isPrimaryFilter: true },
  { key: "power_plant_full", label: "Planta full (100%)", icon: "BatteryCharging", group: "edificio" },
  { key: "water_cistern", label: "Cisterna", icon: "Droplets", group: "edificio" },
  { key: "kids_area", label: "Área infantil", icon: "Baby", group: "edificio" },
  { key: "club_house", label: "Casa club", icon: "Landmark", group: "edificio" },
  { key: "lobby", label: "Lobby", icon: "DoorOpen", group: "edificio" },
  { key: "coworking", label: "Coworking", icon: "Laptop", group: "edificio" },
  { key: "rooftop", label: "Rooftop / terraza social", icon: "Building2", group: "edificio" },
  { key: "bbq_area", label: "Área de BBQ", icon: "Flame", group: "edificio" },
  { key: "visitor_parking", label: "Parqueo de visitas", icon: "CircleParking", group: "edificio" },
  { key: "pet_area", label: "Área para mascotas", icon: "PawPrint", group: "edificio" },

  // Exterior / lote
  { key: "yard", label: "Patio", icon: "Trees", group: "exterior" },
  { key: "garden", label: "Jardín", icon: "Flower2", group: "exterior" },
  { key: "private_pool", label: "Piscina privada", icon: "Waves", group: "exterior" },
  { key: "gated_community", label: "Residencial cerrado", icon: "Fence", group: "exterior", isPrimaryFilter: true },
  { key: "golf_access", label: "Acceso a golf", icon: "Flag", group: "exterior" },
  { key: "marina_access", label: "Acceso a marina", icon: "Anchor", group: "exterior" },

  // Ubicación / vista
  { key: "ocean_view", label: "Vista al mar", icon: "Eye", group: "ubicacion", isPrimaryFilter: true },
  { key: "beachfront", label: "Primera línea de playa", icon: "Sailboat", group: "ubicacion", isPrimaryFilter: true },
  { key: "mountain_view", label: "Vista a la montaña", icon: "Mountain", group: "ubicacion" },
  { key: "city_view", label: "Vista a la ciudad", icon: "Building", group: "ubicacion" },
  { key: "corner_unit", label: "Unidad en esquina", icon: "SquareStack", group: "ubicacion" },

  // Uso / reglas
  { key: "pet_friendly", label: "Pet friendly", icon: "PawPrint", group: "uso", isPrimaryFilter: true },
  { key: "airbnb_friendly", label: "Airbnb friendly", icon: "CalendarCheck", group: "uso", isPrimaryFilter: true },
  { key: "short_term_ok", label: "Alquiler a corto plazo", icon: "CalendarClock", group: "uso" },
];

export const AMENITIES_BY_KEY: Record<string, Amenity> = Object.fromEntries(
  AMENITIES.map((a) => [a.key, a]),
);

export const PRIMARY_FILTER_AMENITIES = AMENITIES.filter((a) => a.isPrimaryFilter);

export const AMENITY_GROUP_LABELS: Record<AmenityGroup, string> = {
  interior: "Interior",
  edificio: "Edificio y áreas comunes",
  exterior: "Exterior",
  ubicacion: "Ubicación y vistas",
  uso: "Uso y reglas",
};

/**
 * Categorías de "búsqueda por estilo de vida" del home.
 * `filters` se aplica al listado al hacer click.
 */
export interface LifestyleCategory {
  slug: string;
  label: string;
  description: string;
  icon: string;
  filters: Record<string, unknown>;
}

export const LIFESTYLE_CATEGORIES: LifestyleCategory[] = [
  {
    slug: "frente-al-mar",
    label: "Frente al mar",
    description: "Propiedades en primera línea de playa o con vista directa al Caribe.",
    icon: "Sailboat",
    filters: { amenities: ["beachfront"] },
  },
  {
    slug: "para-invertir",
    label: "Para invertir",
    description: "Alta demanda de alquiler y potencial de plusvalía.",
    icon: "TrendingUp",
    filters: { amenities: ["airbnb_friendly"], conditionStatus: ["OFF_PLAN", "UNDER_CONSTRUCTION"] },
  },
  {
    slug: "airbnb-friendly",
    label: "Airbnb friendly",
    description: "Reglamento que permite alquiler vacacional a corto plazo.",
    icon: "CalendarCheck",
    filters: { amenities: ["airbnb_friendly"] },
  },
  {
    slug: "vida-urbana",
    label: "Vida urbana",
    description: "En el centro de la ciudad, a pasos de todo.",
    icon: "Building2",
    filters: { locations: ["distrito-nacional", "santiago-de-los-caballeros"], propertyTypes: ["APARTMENT", "PENTHOUSE"] },
  },
  {
    slug: "luxury",
    label: "Luxury",
    description: "Las residencias más exclusivas del país.",
    icon: "Gem",
    filters: { minPrice: 500_000, currency: "USD" },
  },
  {
    slug: "family",
    label: "Para la familia",
    description: "Espacio, seguridad y áreas para niños.",
    icon: "Users",
    filters: { minBedrooms: 3, amenities: ["kids_area", "gated_community"] },
  },
  {
    slug: "retirement",
    label: "Para retirarse",
    description: "Clima, tranquilidad y comunidad para disfrutar la vida.",
    icon: "Sunset",
    filters: { locations: ["las-terrenas", "sosua", "juan-dolio", "jarabacoa"] },
  },
  {
    slug: "vacation-homes",
    label: "Casa de vacaciones",
    description: "Tu segundo hogar para escaparte cuando quieras.",
    icon: "Palmtree",
    filters: { locations: ["punta-cana", "cap-cana", "casa-de-campo", "las-terrenas"] },
  },
];
