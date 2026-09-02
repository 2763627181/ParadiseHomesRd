/**
 * Formateo de texto/números de dominio inmobiliario (no monetario).
 */

export function formatArea(m2: number | null | undefined, unit = "m²"): string {
  if (m2 == null || Number.isNaN(m2)) return "—";
  const rounded = m2 % 1 === 0 ? m2 : Math.round(m2 * 10) / 10;
  return `${new Intl.NumberFormat("es-DO").format(rounded)} ${unit}`;
}

export function formatNumber(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("es-DO").format(value);
}

export function formatBathrooms(value: number | null | undefined): string {
  if (value == null) return "—";
  // 2.5 baños, 3 baños
  return value % 1 === 0 ? String(value) : value.toFixed(1);
}

export interface SpecInput {
  bedrooms?: number | null;
  bathrooms?: number | null;
  parkingSpaces?: number | null;
  constructionM2?: number | null;
  landM2?: number | null;
}

export interface SpecChip {
  key: string;
  value: string;
  label: string;
  icon: string;
}

/** Chips compactos para PropertyCard: "3 hab · 2.5 baños · 2 parqueos · 175 m²". */
export function buildSpecChips(input: SpecInput): SpecChip[] {
  const chips: SpecChip[] = [];
  if (input.bedrooms != null) {
    chips.push({
      key: "bedrooms",
      value: input.bedrooms === 0 ? "Estudio" : `${input.bedrooms}`,
      label: input.bedrooms === 0 ? "Estudio" : input.bedrooms === 1 ? "habitación" : "habitaciones",
      icon: "BedDouble",
    });
  }
  if (input.bathrooms != null) {
    chips.push({
      key: "bathrooms",
      value: formatBathrooms(input.bathrooms),
      label: input.bathrooms === 1 ? "baño" : "baños",
      icon: "Bath",
    });
  }
  if (input.parkingSpaces != null && input.parkingSpaces > 0) {
    chips.push({
      key: "parking",
      value: `${input.parkingSpaces}`,
      label: input.parkingSpaces === 1 ? "parqueo" : "parqueos",
      icon: "Car",
    });
  }
  const area = input.constructionM2 ?? input.landM2;
  if (area != null && area > 0) {
    chips.push({
      key: "area",
      value: formatNumber(area),
      label: input.constructionM2 ? "m²" : "m² de terreno",
      icon: "Ruler",
    });
  }
  return chips;
}

/** "3 hab · 2.5 baños · 175 m²" en una sola línea. */
export function specSummary(input: SpecInput): string {
  return buildSpecChips(input)
    .map((c) => `${c.value} ${c.label}`)
    .join(" · ");
}

export function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

/** "Piantini, Distrito Nacional" a partir de partes de ubicación. */
export function formatLocationLabel(parts: {
  sector?: string | null;
  city?: string | null;
  province?: string | null;
}): string {
  return [parts.sector, parts.city ?? parts.province].filter(Boolean).join(", ");
}

export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function formatPhoneDo(raw: string): string {
  const digits = raw.replace(/\D/g, "").replace(/^1/, "");
  if (digits.length !== 10) return raw;
  return `+1 ${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
}

/** minutos → "responde en ~15 min" / "responde en ~2 h" */
export function formatResponseTime(minutes: number | null | undefined): string | null {
  if (minutes == null || minutes <= 0) return null;
  if (minutes < 60) return `Responde en ~${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Responde en ~${hours} h`;
  return `Responde en ~${Math.round(hours / 24)} días`;
}
