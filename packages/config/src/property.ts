/**
 * Catálogos de presentación para propiedades: etiquetas en español, íconos
 * sugeridos (nombre de lucide-react), y opciones de filtros/orden.
 */

import {
  CONDITION_STATUS,
  CURRENCY,
  OPERATION_TYPE,
  PROPERTY_TYPE,
  type ConditionStatus,
  type Currency,
  type OperationType,
  type PropertyType,
} from "./enums";

export const OPERATION_LABELS: Record<OperationType, string> = {
  [OPERATION_TYPE.SALE]: "Comprar",
  [OPERATION_TYPE.RENT]: "Alquilar",
};

/** Etiqueta como adjetivo para el precio: "US$ ... en venta / en alquiler". */
export const OPERATION_PRICE_SUFFIX: Record<OperationType, string> = {
  [OPERATION_TYPE.SALE]: "",
  [OPERATION_TYPE.RENT]: "/mes",
};

export interface PropertyTypeMeta {
  value: PropertyType;
  /** singular */
  label: string;
  /** plural, para títulos de listado */
  labelPlural: string;
  /** lucide-react icon name */
  icon: string;
  /** aplica a operación de alquiler */
  rentable: boolean;
  /** el tipo describe suelo sin construcción */
  isLand: boolean;
}

export const PROPERTY_TYPES: PropertyTypeMeta[] = [
  { value: PROPERTY_TYPE.APARTMENT, label: "Apartamento", labelPlural: "Apartamentos", icon: "Building2", rentable: true, isLand: false },
  { value: PROPERTY_TYPE.HOUSE, label: "Casa", labelPlural: "Casas", icon: "Home", rentable: true, isLand: false },
  { value: PROPERTY_TYPE.VILLA, label: "Villa", labelPlural: "Villas", icon: "Palmtree", rentable: true, isLand: false },
  { value: PROPERTY_TYPE.PENTHOUSE, label: "Penthouse", labelPlural: "Penthouses", icon: "Building", rentable: true, isLand: false },
  { value: PROPERTY_TYPE.LOT, label: "Solar", labelPlural: "Solares", icon: "LandPlot", rentable: false, isLand: true },
  { value: PROPERTY_TYPE.LAND, label: "Terreno", labelPlural: "Terrenos", icon: "Trees", rentable: false, isLand: true },
  { value: PROPERTY_TYPE.COMMERCIAL, label: "Local comercial", labelPlural: "Locales comerciales", icon: "Store", rentable: true, isLand: false },
  { value: PROPERTY_TYPE.OFFICE, label: "Oficina", labelPlural: "Oficinas", icon: "Briefcase", rentable: true, isLand: false },
];

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = Object.fromEntries(
  PROPERTY_TYPES.map((t) => [t.value, t.label]),
) as Record<PropertyType, string>;

export const PROPERTY_TYPE_LABELS_PLURAL: Record<PropertyType, string> = Object.fromEntries(
  PROPERTY_TYPES.map((t) => [t.value, t.labelPlural]),
) as Record<PropertyType, string>;

export const CONDITION_LABELS: Record<ConditionStatus, string> = {
  [CONDITION_STATUS.NEW]: "Nuevo",
  [CONDITION_STATUS.USED]: "Usado",
  [CONDITION_STATUS.OFF_PLAN]: "En planos",
  [CONDITION_STATUS.UNDER_CONSTRUCTION]: "En construcción",
  [CONDITION_STATUS.READY_TO_MOVE]: "Listo para entrega",
};

export const CURRENCY_META: Record<Currency, { symbol: string; label: string; locale: string }> = {
  [CURRENCY.USD]: { symbol: "US$", label: "Dólares (USD)", locale: "en-US" },
  [CURRENCY.DOP]: { symbol: "RD$", label: "Pesos (DOP)", locale: "es-DO" },
};

/** Rangos de precio sugeridos para el selector rápido del hero, por operación y moneda. */
export const PRICE_PRESETS: Record<
  OperationType,
  Record<Currency, number[]>
> = {
  [OPERATION_TYPE.SALE]: {
    [CURRENCY.USD]: [50_000, 100_000, 150_000, 200_000, 300_000, 500_000, 1_000_000, 2_000_000],
    [CURRENCY.DOP]: [
      3_000_000, 6_000_000, 9_000_000, 12_000_000, 18_000_000, 30_000_000, 60_000_000, 120_000_000,
    ],
  },
  [OPERATION_TYPE.RENT]: {
    [CURRENCY.USD]: [500, 800, 1_200, 1_800, 2_500, 4_000, 6_000, 10_000],
    [CURRENCY.DOP]: [30_000, 45_000, 70_000, 100_000, 150_000, 250_000, 400_000, 600_000],
  },
};

export const BEDROOM_OPTIONS = [
  { value: 0, label: "Estudio" },
  { value: 1, label: "1+" },
  { value: 2, label: "2+" },
  { value: 3, label: "3+" },
  { value: 4, label: "4+" },
  { value: 5, label: "5+" },
] as const;

export const BATHROOM_OPTIONS = [
  { value: 1, label: "1+" },
  { value: 2, label: "2+" },
  { value: 3, label: "3+" },
  { value: 4, label: "4+" },
] as const;

export const PARKING_OPTIONS = [
  { value: 1, label: "1+" },
  { value: 2, label: "2+" },
  { value: 3, label: "3+" },
] as const;

export const SORT_OPTIONS = [
  { value: "relevance", label: "Más relevantes" },
  { value: "recent", label: "Más recientes" },
  { value: "price_asc", label: "Precio: menor a mayor" },
  { value: "price_desc", label: "Precio: mayor a menor" },
  { value: "area_desc", label: "Mayor superficie" },
  { value: "price_per_m2_asc", label: "Mejor precio por m²" },
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number]["value"];
export const DEFAULT_SORT: SortOption = "relevance";

/** Días sin actualizar tras los cuales una propiedad se considera "no fresca". */
export const FRESHNESS_STALE_DAYS = 21;

/** Prefijo de código de propiedad por tipo: PH-APT-00123 */
export const PROPERTY_CODE_PREFIX: Record<PropertyType, string> = {
  [PROPERTY_TYPE.APARTMENT]: "APT",
  [PROPERTY_TYPE.HOUSE]: "CAS",
  [PROPERTY_TYPE.VILLA]: "VIL",
  [PROPERTY_TYPE.PENTHOUSE]: "PEN",
  [PROPERTY_TYPE.LOT]: "SOL",
  [PROPERTY_TYPE.LAND]: "TER",
  [PROPERTY_TYPE.COMMERCIAL]: "LOC",
  [PROPERTY_TYPE.OFFICE]: "OFI",
};
