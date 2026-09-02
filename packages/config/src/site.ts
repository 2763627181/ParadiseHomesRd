/**
 * Metadatos del sitio, navegación y datos de contacto de Paradise Homes RD.
 * Los valores sensibles / de entorno se leen aparte; aquí solo lo público y estable.
 */

export const SITE = {
  name: "Paradise Homes RD",
  shortName: "Paradise Homes",
  region: "RD",
  tagline: "Tu próximo hogar comienza aquí.",
  description:
    "Descubre propiedades verificadas para comprar, alquilar o invertir en República Dominicana. Paradise Homes RD conecta compradores con inmobiliarias, desarrolladores y asesores.",
  locale: "es-DO",
  defaultCurrency: "USD",
  timezone: "America/Santo_Domingo",
  countryCode: "DO",
  /** URL canónica; se sobreescribe con NEXT_PUBLIC_APP_URL en runtime */
  url: "https://paradisehomesrd.com",
  ogImage: "/opengraph-image",
  themeColor: {
    light: "#FAFAF8",
    dark: "#0F1512",
  },
} as const;

export const CONTACT = {
  founderName: "Joseph Steven Julián Ortiz",
  whatsapp: "18498620269",
  whatsappDisplay: "+1 849-862-0269",
  email: "hola@paradisehomesrd.com",
  partnersEmail: "partners@paradisehomesrd.com",
} as const;

export const SOCIAL = {
  instagram: "https://instagram.com/paradisehomesrd",
  tiktok: "https://tiktok.com/@paradisehomesrd",
  facebook: "https://facebook.com/paradisehomesrd",
  youtube: "https://youtube.com/@paradisehomesrd",
} as const;

export interface NavItem {
  label: string;
  href: string;
  description?: string;
}

/** Navegación principal del header (desktop). */
export const PRIMARY_NAV: NavItem[] = [
  { label: "Comprar", href: "/buy", description: "Propiedades en venta en todo el país" },
  { label: "Alquilar", href: "/rent", description: "Apartamentos y casas en alquiler" },
  { label: "Proyectos", href: "/projects", description: "Obra nueva y preventa de desarrolladores" },
  { label: "Mapa", href: "/map", description: "Explora propiedades sobre el mapa" },
  { label: "Inmobiliarias", href: "/agencies", description: "Directorio de inmobiliarias verificadas" },
  { label: "Agentes", href: "/agents", description: "Encuentra un asesor por zona" },
];

/** Acciones del header a la derecha. */
export const HEADER_ACTIONS: NavItem[] = [
  { label: "Publicar propiedad", href: "/list-property" },
  { label: "Favoritos", href: "/favorites" },
  { label: "Iniciar sesión", href: "/login" },
];

/** Bottom navigation de mobile (usuario). */
export const MOBILE_NAV: (NavItem & { icon: string })[] = [
  { label: "Inicio", href: "/", icon: "Home" },
  { label: "Buscar", href: "/properties", icon: "Search" },
  { label: "Mapa", href: "/map", icon: "Map" },
  { label: "Favoritos", href: "/favorites", icon: "Heart" },
  { label: "Perfil", href: "/dashboard", icon: "User" },
];

export interface FooterColumn {
  title: string;
  links: NavItem[];
}

export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: "Explorar",
    links: [
      { label: "Comprar", href: "/buy" },
      { label: "Alquilar", href: "/rent" },
      { label: "Proyectos", href: "/projects" },
      { label: "Mapa", href: "/map" },
      { label: "Insights del mercado", href: "/market" },
    ],
  },
  {
    title: "Empresa",
    links: [
      { label: "Sobre nosotros", href: "/about" },
      { label: "Partners", href: "/partners" },
      { label: "Publicar propiedad", href: "/list-property" },
      { label: "Contacto", href: "/contact" },
    ],
  },
  {
    title: "Recursos",
    links: [
      { label: "Guías", href: "/blog?category=guias" },
      { label: "Blog", href: "/blog" },
      { label: "Calculadora hipotecaria", href: "/mortgage-calculator" },
      { label: "Preguntas frecuentes", href: "/faq" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacidad", href: "/privacy" },
      { label: "Términos", href: "/terms" },
      { label: "Cookies", href: "/cookies" },
    ],
  },
];

/** "Cómo funciona Paradise" — pasos del home. */
export const HOW_IT_WORKS = [
  {
    title: "Explora con confianza",
    description:
      "Filtra por zona, precio y estilo de vida. Cada publicación marcada Paradise Verified fue revisada por nuestro equipo.",
    icon: "Search",
  },
  {
    title: "Conecta directo",
    description:
      "Contacta al asesor o la inmobiliaria por WhatsApp en un toque, agenda una visita o solicita información.",
    icon: "MessageCircle",
  },
  {
    title: "Cierra sin intermediarios ocultos",
    description:
      "El acuerdo se hace directamente entre tú y el vendedor. Paradise te acompaña en el camino.",
    icon: "Handshake",
  },
];
