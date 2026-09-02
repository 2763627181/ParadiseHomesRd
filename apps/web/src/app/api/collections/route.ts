import { NextResponse, type NextRequest } from "next/server";

import { getProjectsByIds, getPropertiesByIds } from "@/lib/data/collections";

export const runtime = "nodejs";

/** GET /api/collections?properties=id1,id2&projects=id3 → summaries para favoritos / comparador. */
export async function GET(request: NextRequest) {
  const propertyIds = (request.nextUrl.searchParams.get("properties") ?? "")
    .split(",")
    .filter(Boolean)
    .slice(0, 50);
  const projectIds = (request.nextUrl.searchParams.get("projects") ?? "")
    .split(",")
    .filter(Boolean)
    .slice(0, 50);

  const [properties, projects] = await Promise.all([
    getPropertiesByIds(propertyIds),
    getProjectsByIds(projectIds),
  ]);

  return NextResponse.json({ properties, projects });
}
