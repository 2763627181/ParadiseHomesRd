import { NextResponse, type NextRequest } from "next/server";
import { pricePerM2 } from "@paradise/utils/currency";
import type { PropertyComparisonRow } from "@paradise/types";

import { getFullPropertiesByIds } from "@/lib/data/collections";

export const runtime = "nodejs";

/** GET /api/compare?ids=id1,id2 → filas listas para la tabla comparadora (spec §32). */
export async function GET(request: NextRequest) {
  const ids = (request.nextUrl.searchParams.get("ids") ?? "")
    .split(",")
    .filter(Boolean)
    .slice(0, 4);

  const properties = await getFullPropertiesByIds(ids);

  // Preserva el orden en que el usuario los añadió al comparador.
  const bySlugOrder = new Map(ids.map((id, i) => [id, i]));
  properties.sort((a, b) => (bySlugOrder.get(a.id) ?? 0) - (bySlugOrder.get(b.id) ?? 0));

  const items: PropertyComparisonRow[] = properties.map((property) => ({
    property,
    pricePerM2: property.price.onRequest
      ? null
      : pricePerM2(property.price.amount, property.constructionM2),
    maintenanceFee: property.maintenanceFee,
    deliveryDate: property.deliveryDate,
    amenityKeys: property.amenityKeys,
    airbnbFriendly: property.airbnbFriendly,
    conditionStatus: property.conditionStatus,
  }));

  return NextResponse.json({ items });
}
