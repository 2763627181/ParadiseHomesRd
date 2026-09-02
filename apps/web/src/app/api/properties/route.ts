import { NextResponse, type NextRequest } from "next/server";

import { parseSearchParams } from "@/lib/search-params";
import { searchProperties } from "@/lib/data/properties";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const raw = Object.fromEntries(request.nextUrl.searchParams.entries());
  const params = parseSearchParams(raw);
  const result = await searchProperties(params);

  return NextResponse.json(result, {
    headers: { "cache-control": "public, s-maxage=30, stale-while-revalidate=120" },
  });
}
