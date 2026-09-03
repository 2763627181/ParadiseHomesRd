import "server-only";

import type { PropertyStatus } from "@paradise/config";

import { getSupabaseAdminClient } from "@/lib/supabase/server";

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface AdminPropertyRow {
  id: string;
  code: string;
  slug: string;
  title: string;
  status: PropertyStatus;
  operationType: string;
  propertyType: string;
  price: number | null;
  currency: string;
  priceOnRequest: boolean;
  cityName: string | null;
  sectorName: string | null;
  agentName: string | null;
  agencyName: string | null;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  imageCount: number;
  coverUrl: string | null;
  isVerified: boolean;
  isDemo: boolean;
  rejectReason: string | null;
  createdAt: string;
}

export async function getAdminProperties(
  status?: PropertyStatus | "ALL",
): Promise<{ rows: AdminPropertyRow[]; counts: Record<string, number> } | null> {
  const admin = getSupabaseAdminClient();
  if (!admin) return null;

  const { data: statusRows } = await admin.from("properties").select("status");
  const counts: Record<string, number> = { ALL: 0 };
  for (const r of (statusRows ?? []) as { status: string }[]) {
    counts[r.status] = (counts[r.status] ?? 0) + 1;
    counts.ALL = (counts.ALL ?? 0) + 1;
  }

  let q = admin
    .from("properties")
    .select(
      `id, code, slug, title, status, operation_type, property_type, price, currency,
       price_on_request, contact_name, contact_phone, contact_email, is_verified, is_demo,
       reject_reason, created_at,
       city:locations!properties_city_id_fkey(name),
       sector:locations!properties_sector_id_fkey(name),
       agent:agents(full_name),
       agency:agencies(name),
       images:property_images(url, is_cover, position)`,
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (status && status !== "ALL") q = q.eq("status", status);

  const { data, error } = await q;
  if (error) {
    console.error("[getAdminProperties]", error.message);
    return null;
  }

  const rows: AdminPropertyRow[] = (data ?? []).map((p: any) => {
    const images = (p.images ?? []).sort(
      (a: any, b: any) => Number(b.is_cover) - Number(a.is_cover) || a.position - b.position,
    );
    return {
      id: p.id,
      code: p.code,
      slug: p.slug,
      title: p.title,
      status: p.status,
      operationType: p.operation_type,
      propertyType: p.property_type,
      price: p.price == null ? null : Number(p.price),
      currency: p.currency,
      priceOnRequest: p.price_on_request,
      cityName: p.city?.name ?? null,
      sectorName: p.sector?.name ?? null,
      agentName: p.agent?.full_name ?? null,
      agencyName: p.agency?.name ?? null,
      contactName: p.contact_name,
      contactPhone: p.contact_phone,
      contactEmail: p.contact_email,
      imageCount: images.length,
      coverUrl: images[0]?.url ?? null,
      isVerified: p.is_verified,
      isDemo: p.is_demo,
      rejectReason: p.reject_reason,
      createdAt: p.created_at,
    };
  });

  return { rows, counts };
}
