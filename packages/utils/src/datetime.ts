/**
 * Fechas en la zona horaria de República Dominicana (America/Santo_Domingo).
 * Los timestamps se guardan en UTC; aquí se presentan.
 */

import { TZDate } from "@date-fns/tz";
import { differenceInCalendarDays, differenceInHours, differenceInMinutes, format } from "date-fns";
import { es } from "date-fns/locale";

export const RD_TIMEZONE = "America/Santo_Domingo";

export function toRdDate(input: Date | string | number): TZDate {
  return new TZDate(input instanceof Date ? input : new Date(input), RD_TIMEZONE);
}

/** "10:21 a. m." */
export function formatTimeRd(input: Date | string | number): string {
  return format(toRdDate(input), "h:mm a", { locale: es });
}

/** "10 sept 2026" */
export function formatDateRd(input: Date | string | number): string {
  return format(toRdDate(input), "d MMM yyyy", { locale: es });
}

/** "10 sept 2026, 10:21 a. m." */
export function formatDateTimeRd(input: Date | string | number): string {
  return format(toRdDate(input), "d MMM yyyy, h:mm a", { locale: es });
}

/** "sábado 10 de septiembre" — para agenda de visitas */
export function formatVisitDateRd(input: Date | string | number): string {
  return format(toRdDate(input), "EEEE d 'de' MMMM", { locale: es });
}

/**
 * Tiempo relativo en español, corto. Ej: "hace 3 días", "hace 2 h", "hoy".
 * Pensado para timelines y feeds.
 */
export function formatRelativeRd(input: Date | string | number, now: Date = new Date()): string {
  const date = new Date(input);
  const minutes = differenceInMinutes(now, date);
  const hours = differenceInHours(now, date);
  const days = differenceInCalendarDays(now, date);

  if (minutes < 1) return "ahora mismo";
  if (minutes < 60) return `hace ${minutes} min`;
  if (hours < 24 && days === 0) return `hace ${hours} h`;
  if (days === 0) return "hoy";
  if (days === 1) return "ayer";
  if (days < 7) return `hace ${days} días`;
  if (days < 30) return `hace ${Math.floor(days / 7)} sem`;
  if (days < 365) return `hace ${Math.floor(days / 30)} meses`;
  return `hace ${Math.floor(days / 365)} años`;
}

/** Mensaje de disponibilidad para el detalle de propiedad (freshness). */
export function freshnessLabel(
  lastVerifiedAt: Date | string | number | null | undefined,
  staleDays = 21,
  now: Date = new Date(),
): { label: string; isStale: boolean; days: number } {
  if (!lastVerifiedAt) {
    return { label: "Disponibilidad no confirmada", isStale: true, days: Number.POSITIVE_INFINITY };
  }
  const days = differenceInCalendarDays(now, new Date(lastVerifiedAt));
  if (days <= 0) return { label: "Disponibilidad actualizada hoy", isStale: false, days: 0 };
  if (days === 1) return { label: "Actualizado ayer", isStale: false, days };
  return { label: `Actualizado hace ${days} días`, isStale: days > staleDays, days };
}

export function nowRdIso(): string {
  return new Date().toISOString();
}
