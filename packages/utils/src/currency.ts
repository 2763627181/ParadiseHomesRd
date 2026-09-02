/**
 * Formateo de precios. El precio contractual NUNCA se altera por conversión:
 * `convertForDisplay` produce solo un valor de referencia visual.
 */

export type CurrencyCode = "USD" | "DOP";

const CURRENCY_SYMBOL: Record<CurrencyCode, string> = {
  USD: "US$",
  DOP: "RD$",
};

export interface FormatPriceOptions {
  /** mostrar decimales (por defecto, no) */
  decimals?: boolean;
  /** abreviar millones/miles: US$1.2M, US$185K */
  compact?: boolean;
  /** sufijo, p. ej. "/mes" para alquiler */
  suffix?: string;
  /** texto cuando no hay precio */
  fallback?: string;
}

export function currencySymbol(currency: CurrencyCode): string {
  return CURRENCY_SYMBOL[currency] ?? "";
}

export function formatPrice(
  amount: number | null | undefined,
  currency: CurrencyCode = "USD",
  options: FormatPriceOptions = {},
): string {
  const { decimals = false, compact = false, suffix = "", fallback = "Precio a consultar" } = options;

  if (amount == null || Number.isNaN(amount)) return fallback;

  const symbol = currencySymbol(currency);

  if (compact && Math.abs(amount) >= 1000) {
    return `${symbol}${formatCompactNumber(amount)}${suffix}`;
  }

  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  }).format(amount);

  return `${symbol}${formatted}${suffix}`;
}

export function formatCompactNumber(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) {
    return trimZero(value / 1_000_000) + "M";
  }
  if (abs >= 1_000) {
    return trimZero(value / 1_000) + "K";
  }
  return String(Math.round(value));
}

function trimZero(n: number): string {
  return n
    .toFixed(1)
    .replace(/\.0$/, "")
    .replace(/(\.\d)0$/, "$1");
}

export function formatPriceRange(
  min: number | null | undefined,
  max: number | null | undefined,
  currency: CurrencyCode = "USD",
  options: FormatPriceOptions = {},
): string {
  const opts: FormatPriceOptions = { compact: true, ...options };
  if (min != null && max != null) {
    if (min === max) return formatPrice(min, currency, opts);
    return `${formatPrice(min, currency, opts)} – ${formatPrice(max, currency, opts)}`;
  }
  if (min != null) return `Desde ${formatPrice(min, currency, opts)}`;
  if (max != null) return `Hasta ${formatPrice(max, currency, opts)}`;
  return options.fallback ?? "Precio a consultar";
}

export function pricePerM2(
  price: number | null | undefined,
  areaM2: number | null | undefined,
): number | null {
  if (!price || !areaM2 || areaM2 <= 0) return null;
  return Math.round(price / areaM2);
}

export function formatPricePerM2(
  price: number | null | undefined,
  areaM2: number | null | undefined,
  currency: CurrencyCode = "USD",
): string | null {
  const value = pricePerM2(price, areaM2);
  if (value == null) return null;
  return `${formatPrice(value, currency)}/m²`;
}

/**
 * Conversión de referencia SOLO para mostrar. `rate` = unidades de `to` por 1 `from`.
 * No usar para nada contractual.
 */
export function convertForDisplay(amount: number, rate: number): number {
  return Math.round(amount * rate);
}
