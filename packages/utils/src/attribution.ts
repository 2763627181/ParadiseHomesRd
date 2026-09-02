/**
 * Atribución de leads. Nunca se pierde el origen de un lead.
 *
 * Flujo:
 *  1. En cada carga de página se llama `readAttributionParams(url)`.
 *  2. Se hace merge con el snapshot guardado en cookie (`ph_attribution`, 90 días):
 *     - `firstTouch` se fija una sola vez.
 *     - `lastTouch` se actualiza si la nueva visita trae UTM/click ids.
 *  3. Al crear un lead se copia el snapshot completo a la fila `leads`.
 */

export const ATTRIBUTION_COOKIE = "ph_attribution";
export const ATTRIBUTION_MAX_AGE_DAYS = 90;

export type LeadSource =
  | "meta_ads"
  | "instagram"
  | "facebook"
  | "tiktok"
  | "google"
  | "youtube"
  | "organic"
  | "referral"
  | "direct";

export interface AttributionParams {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  gclid?: string;
  fbclid?: string;
  ttclid?: string;
  referrer?: string;
  landingPage?: string;
}

export interface AttributionSnapshot {
  firstTouch: AttributionParams & { at: string };
  lastTouch: AttributionParams & { at: string };
  source: LeadSource;
}

const UTM_KEYS: Record<string, keyof AttributionParams> = {
  utm_source: "utmSource",
  utm_medium: "utmMedium",
  utm_campaign: "utmCampaign",
  utm_content: "utmContent",
  utm_term: "utmTerm",
  gclid: "gclid",
  fbclid: "fbclid",
  ttclid: "ttclid",
};

export function readAttributionParams(
  url: string,
  referrer?: string,
): AttributionParams {
  const params: AttributionParams = {};
  try {
    const parsed = new URL(url);
    for (const [param, key] of Object.entries(UTM_KEYS)) {
      const value = parsed.searchParams.get(param);
      if (value) params[key] = value.slice(0, 200);
    }
    params.landingPage = parsed.pathname + parsed.search;
  } catch {
    // url inválida: ignorar
  }
  if (referrer && !isSameHost(url, referrer)) {
    params.referrer = referrer.slice(0, 300);
  }
  return params;
}

function isSameHost(a: string, b: string): boolean {
  try {
    return new URL(a).host === new URL(b).host;
  } catch {
    return false;
  }
}

export function hasSignal(params: AttributionParams): boolean {
  return Boolean(
    params.utmSource ||
      params.utmMedium ||
      params.utmCampaign ||
      params.gclid ||
      params.fbclid ||
      params.ttclid ||
      params.referrer,
  );
}

/** Deriva un canal legible a partir de los parámetros de atribución. */
export function deriveLeadSource(params: AttributionParams): LeadSource {
  const source = params.utmSource?.toLowerCase() ?? "";
  const medium = params.utmMedium?.toLowerCase() ?? "";

  if (params.fbclid || source.includes("fb") || source.includes("facebook") || source.includes("meta")) {
    return medium.includes("paid") || medium.includes("cpc") || medium.includes("ads")
      ? "meta_ads"
      : source.includes("instagram") || source === "ig"
        ? "instagram"
        : "facebook";
  }
  if (source.includes("instagram") || source === "ig") return "instagram";
  if (params.ttclid || source.includes("tiktok")) return "tiktok";
  if (params.gclid || source.includes("google")) return "google";
  if (source.includes("youtube") || source === "yt") return "youtube";

  if (params.referrer) {
    const host = safeHost(params.referrer);
    if (host.includes("instagram")) return "instagram";
    if (host.includes("facebook")) return "facebook";
    if (host.includes("tiktok")) return "tiktok";
    if (host.includes("google")) return "google";
    if (host.includes("youtube")) return "youtube";
    return "referral";
  }

  if (source || medium) return medium.includes("organic") ? "organic" : "referral";
  return "direct";
}

function safeHost(u: string): string {
  try {
    return new URL(u).host.toLowerCase();
  } catch {
    return "";
  }
}

export function mergeAttribution(
  previous: AttributionSnapshot | null,
  incoming: AttributionParams,
  now: string = new Date().toISOString(),
): AttributionSnapshot {
  const touch = { ...incoming, at: now };
  if (!previous) {
    return { firstTouch: touch, lastTouch: touch, source: deriveLeadSource(incoming) };
  }
  if (hasSignal(incoming)) {
    return {
      firstTouch: previous.firstTouch,
      lastTouch: touch,
      source: deriveLeadSource(incoming),
    };
  }
  return previous;
}

export function serializeAttribution(snapshot: AttributionSnapshot): string {
  return JSON.stringify(snapshot);
}

export function parseAttribution(raw: string | undefined | null): AttributionSnapshot | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as AttributionSnapshot;
    if (parsed.firstTouch && parsed.lastTouch) return parsed;
    return null;
  } catch {
    return null;
  }
}
