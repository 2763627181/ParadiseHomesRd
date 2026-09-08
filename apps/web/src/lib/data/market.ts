import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase/server";

/* ─────────────────────────────────────────────────────────────────────────────
 * Insights del mercado — SOLO con datos reales de las propiedades publicadas
 * de la plataforma. Nada de estimaciones inventadas: si no hay inventario
 * suficiente para una zona, no se muestra.
 * ───────────────────────────────────────────────────────────────────────────── */

const USD_PER_DOP = 1 / 59;
const toUsd = (amount: number, currency: string) =>
  currency === "USD" ? amount : Math.round(amount * USD_PER_DOP);

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid]! : Math.round((s[mid - 1]! + s[mid]!) / 2);
}

export interface CityMarketRow {
  city: string;
  province: string | null;
  listings: number;
  medianSaleUsd: number | null;
  pricePerM2Usd: number | null;
  medianRentUsd: number | null;
}

export interface MarketInsights {
  totalListings: number;
  totalCities: number;
  overallPricePerM2Usd: number | null;
  cities: CityMarketRow[];
  byType: { type: string; count: number; medianUsd: number | null }[];
  updatedAt: string;
}


export async function getMarketInsights(): Promise<MarketInsights | null> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("property_summaries")
    .select(
      "operation_type, property_type, price, currency, price_on_request, construction_m2, city_name, province_name",
    )
    .eq("status", "PUBLISHED")
    .limit(5000);

  if (error || !data) {
    if (error) console.error("[getMarketInsights]", error.message);
    return null;
  }

  const rows = (data as any[])
    .map((r) => ({ ...r, city: r.city_name, province: r.province_name }))
    .filter((r) => !r.price_on_request && r.price && r.city);

  // ── por ciudad ───────────────────────────────────────────────────────────
  interface CityBucket {
    province: string | null;
    sale: number[];
    rent: number[];
    ppm2: number[];
    count: number;
  }
  const byCity = new Map<string, CityBucket>();
  for (const r of rows) {
    const key = r.city as string;
    const bucket: CityBucket =
      byCity.get(key) ?? { province: r.province ?? null, sale: [], rent: [], ppm2: [], count: 0 };
    bucket.count++;
    const usd = toUsd(Number(r.price), r.currency);
    if (r.operation_type === "SALE") {
      bucket.sale.push(usd);
      if (r.construction_m2 && Number(r.construction_m2) > 10) {
        bucket.ppm2.push(Math.round(usd / Number(r.construction_m2)));
      }
    } else if (r.operation_type === "RENT") {
      bucket.rent.push(usd);
    }
    byCity.set(key, bucket);
  }

  const cities: CityMarketRow[] = [...byCity.entries()]
    .filter(([, b]) => b.count >= 3) // sin inventario suficiente, no se publica
    .map(([city, b]) => ({
      city,
      province: b.province,
      listings: b.count,
      medianSaleUsd: b.sale.length >= 3 ? median(b.sale) : null,
      pricePerM2Usd: b.ppm2.length >= 3 ? median(b.ppm2) : null,
      medianRentUsd: b.rent.length >= 3 ? median(b.rent) : null,
    }))
    .sort((a, b) => b.listings - a.listings);

  // ── por tipo ─────────────────────────────────────────────────────────────
  const byType = new Map<string, number[]>();
  for (const r of rows) {
    if (r.operation_type !== "SALE") continue;
    const list = byType.get(r.property_type) ?? [];
    list.push(toUsd(Number(r.price), r.currency));
    byType.set(r.property_type, list);
  }
  const byTypeRows = [...byType.entries()]
    .map(([type, prices]) => ({ type, count: prices.length, medianUsd: prices.length >= 3 ? median(prices) : null }))
    .sort((a, b) => b.count - a.count);

  const allPpm2 = rows
    .filter((r) => r.operation_type === "SALE" && r.construction_m2 && Number(r.construction_m2) > 10)
    .map((r) => Math.round(toUsd(Number(r.price), r.currency) / Number(r.construction_m2)));

  return {
    totalListings: rows.length,
    totalCities: cities.length,
    overallPricePerM2Usd: allPpm2.length >= 5 ? median(allPpm2) : null,
    cities,
    byType: byTypeRows,
    updatedAt: new Date().toISOString(),
  };
}
