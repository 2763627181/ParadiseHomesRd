"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  PROPERTY_TYPE_LABELS,
  OPERATION_TYPE,
  PROPERTY_TYPE,
  CONDITION_STATUS,
  AMENITIES_BY_KEY,
} from "@paradise/config";
import { buildPropertySlug, toSlug } from "@paradise/utils/slug";

import { isSupabaseConfigured } from "@/lib/env";
import { getSessionUser, isAgencyUser, isStaffUser } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { resolveLocationIds } from "@/lib/actions/list-property-shared";

export interface ImportRowResult {
  line: number;
  ok: boolean;
  code?: string;
  title: string;
  error?: string;
}

export interface ImportResult {
  ok: boolean;
  message?: string;
  created: number;
  failed: number;
  rows: ImportRowResult[];
}

/* ── mapeo tolerante de enums (acepta español o el valor crudo) ───────────── */

const OP_MAP: Record<string, string> = {
  venta: OPERATION_TYPE.SALE,
  vender: OPERATION_TYPE.SALE,
  sale: OPERATION_TYPE.SALE,
  alquiler: OPERATION_TYPE.RENT,
  alquilar: OPERATION_TYPE.RENT,
  renta: OPERATION_TYPE.RENT,
  rent: OPERATION_TYPE.RENT,
};

const TYPE_MAP: Record<string, string> = {
  apartamento: PROPERTY_TYPE.APARTMENT,
  apartment: PROPERTY_TYPE.APARTMENT,
  casa: PROPERTY_TYPE.HOUSE,
  house: PROPERTY_TYPE.HOUSE,
  villa: PROPERTY_TYPE.VILLA,
  penthouse: PROPERTY_TYPE.PENTHOUSE,
  solar: PROPERTY_TYPE.LOT,
  lote: PROPERTY_TYPE.LOT,
  lot: PROPERTY_TYPE.LOT,
  terreno: PROPERTY_TYPE.LAND,
  land: PROPERTY_TYPE.LAND,
  local: PROPERTY_TYPE.COMMERCIAL,
  comercial: PROPERTY_TYPE.COMMERCIAL,
  commercial: PROPERTY_TYPE.COMMERCIAL,
  oficina: PROPERTY_TYPE.OFFICE,
  office: PROPERTY_TYPE.OFFICE,
};

const CONDITION_MAP: Record<string, string> = {
  nuevo: CONDITION_STATUS.NEW,
  new: CONDITION_STATUS.NEW,
  usado: CONDITION_STATUS.USED,
  used: CONDITION_STATUS.USED,
  planos: CONDITION_STATUS.OFF_PLAN,
  "en planos": CONDITION_STATUS.OFF_PLAN,
  off_plan: CONDITION_STATUS.OFF_PLAN,
  construccion: CONDITION_STATUS.UNDER_CONSTRUCTION,
  "en construccion": CONDITION_STATUS.UNDER_CONSTRUCTION,
  under_construction: CONDITION_STATUS.UNDER_CONSTRUCTION,
  "listo para mudarse": CONDITION_STATUS.READY_TO_MOVE,
  ready_to_move: CONDITION_STATUS.READY_TO_MOVE,
};

const norm = (s: string) => s.trim().toLowerCase();
const num = (s: string): number | undefined => {
  if (!s?.trim()) return undefined;
  const n = Number(s.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : undefined;
};
const list = (s: string): string[] =>
  (s ?? "")
    .split(/[;|]/)
    .map((x) => x.trim())
    .filter(Boolean);
const yes = (s: string) => ["si", "sí", "yes", "true", "1", "x"].includes(norm(s ?? ""));

const rowSchema = z.object({
  operationType: z.enum([OPERATION_TYPE.SALE, OPERATION_TYPE.RENT]),
  propertyType: z.enum(Object.values(PROPERTY_TYPE) as [string, ...string[]]),
  conditionStatus: z.enum(Object.values(CONDITION_STATUS) as [string, ...string[]]).optional(),
  provinceSlug: z.string().min(1, "provincia_slug requerido"),
  citySlug: z.string().min(1, "ciudad_slug requerido"),
  sectorSlug: z.string().optional(),
  address: z.string().max(200).optional(),
  title: z.string().trim().min(8, "título muy corto").max(120),
  description: z.string().trim().min(40, "descripción muy corta (mín. 40)").max(5000),
  bedrooms: z.number().int().min(0).max(30).optional(),
  bathrooms: z.number().min(0).max(30).optional(),
  parkingSpaces: z.number().int().min(0).max(30).optional(),
  constructionM2: z.number().positive().max(100000).optional(),
  landM2: z.number().positive().max(10000000).optional(),
  priceOnRequest: z.boolean(),
  price: z.number().positive().max(500_000_000).optional(),
  currency: z.enum(["USD", "DOP"]),
  amenityKeys: z.array(z.string()),
  imageUrls: z.array(z.string().url("URL de foto no válida")).max(40),
  contactName: z.string().trim().min(2).max(120),
  contactPhone: z.string().trim().min(7).max(20),
  contactEmail: z.string().trim().email("correo no válido"),
});

function mapRow(raw: Record<string, string>) {
  const g = (k: string) => raw[k] ?? "";
  const priceOnRequest = yes(g("precio_a_consultar"));
  return {
    operationType: OP_MAP[norm(g("operacion"))] ?? g("operacion").toUpperCase(),
    propertyType: TYPE_MAP[norm(g("tipo"))] ?? g("tipo").toUpperCase(),
    conditionStatus: g("estado") ? (CONDITION_MAP[norm(g("estado"))] ?? g("estado").toUpperCase()) : undefined,
    provinceSlug: toSlug(g("provincia_slug")),
    citySlug: toSlug(g("ciudad_slug")),
    sectorSlug: g("sector_slug") ? toSlug(g("sector_slug")) : undefined,
    address: g("direccion") || undefined,
    title: g("titulo"),
    description: g("descripcion"),
    bedrooms: num(g("habitaciones")),
    bathrooms: num(g("banos")),
    parkingSpaces: num(g("parqueos")),
    constructionM2: num(g("m2_construccion")),
    landM2: num(g("m2_terreno")),
    priceOnRequest,
    price: priceOnRequest ? undefined : num(g("precio")),
    currency: norm(g("moneda")) === "dop" ? "DOP" : "USD",
    amenityKeys: list(g("amenidades")).filter((k) => AMENITIES_BY_KEY[k]),
    imageUrls: list(g("fotos")),
    contactName: g("contacto_nombre"),
    contactPhone: g("contacto_telefono"),
    contactEmail: g("contacto_email"),
  };
}

export const IMPORT_TEMPLATE_HEADERS = [
  "operacion",
  "tipo",
  "estado",
  "provincia_slug",
  "ciudad_slug",
  "sector_slug",
  "titulo",
  "descripcion",
  "habitaciones",
  "banos",
  "parqueos",
  "m2_construccion",
  "m2_terreno",
  "precio",
  "moneda",
  "precio_a_consultar",
  "direccion",
  "amenidades",
  "fotos",
  "contacto_nombre",
  "contacto_telefono",
  "contacto_email",
] as const;

/** Importa un lote de propiedades desde filas CSV (objetos por cabecera). Quedan en PENDING_REVIEW. */
export async function importProperties(rawRows: Record<string, string>[]): Promise<ImportResult> {
  const user = await getSessionUser();
  if (!user || !(isStaffUser(user) || isAgencyUser(user))) {
    return { ok: false, message: "No autorizado.", created: 0, failed: 0, rows: [] };
  }
  if (!isSupabaseConfigured) {
    return { ok: false, message: "Backend no disponible.", created: 0, failed: 0, rows: [] };
  }
  if (rawRows.length === 0) return { ok: false, message: "El archivo no tiene filas.", created: 0, failed: 0, rows: [] };
  if (rawRows.length > 200) {
    return { ok: false, message: "Máximo 200 propiedades por archivo.", created: 0, failed: 0, rows: [] };
  }

  const admin = getSupabaseAdminClient();
  if (!admin) return { ok: false, message: "Servicio no disponible.", created: 0, failed: 0, rows: [] };

  const membership = user.memberships.find((m) => m.organizationType === "agency");
  const agencyId = membership?.organizationId ?? null;
  const agentId = user.agentId ?? null;

  const rows: ImportRowResult[] = [];
  let created = 0;

  for (let i = 0; i < rawRows.length; i++) {
    const line = i + 2; // +1 por índice base 1, +1 por la fila de cabecera
    const mapped = mapRow(rawRows[i]!);
    const parsed = rowSchema.safeParse(mapped);
    if (!parsed.success) {
      rows.push({ line, ok: false, title: mapped.title || "(sin título)", error: parsed.error.issues[0]?.message });
      continue;
    }
    const d = parsed.data;

    try {
      const locIds = await resolveLocationIds(admin, {
        province: d.provinceSlug,
        city: d.citySlug,
        sector: d.sectorSlug,
      });
      if (!locIds.city) {
        rows.push({ line, ok: false, title: d.title, error: `ciudad_slug "${d.citySlug}" no existe` });
        continue;
      }

      const tempSlug = `${toSlug(PROPERTY_TYPE_LABELS[d.propertyType as keyof typeof PROPERTY_TYPE_LABELS])}-${toSlug(d.citySlug)}-${Date.now().toString(36)}-${i}`;
      const { data: inserted, error } = await admin
        .from("properties")
        .insert({
          slug: tempSlug,
          code: "",
          title: d.title,
          description: d.description,
          operation_type: d.operationType,
          property_type: d.propertyType,
          condition_status: d.conditionStatus ?? null,
          price: d.priceOnRequest ? null : (d.price ?? null),
          price_on_request: d.priceOnRequest,
          currency: d.currency,
          bedrooms: d.bedrooms ?? null,
          bathrooms: d.bathrooms ?? null,
          parking_spaces: d.parkingSpaces ?? null,
          construction_m2: d.constructionM2 ?? null,
          land_m2: d.landM2 ?? null,
          address: d.address ?? null,
          sector_id: locIds.sector,
          city_id: locIds.city,
          province_id: locIds.province,
          status: "PENDING_REVIEW",
          moderation_state: "PENDING_REVIEW",
          owner_profile_id: user.id,
          agent_id: agentId,
          agency_id: agencyId,
          contact_name: d.contactName,
          contact_phone: d.contactPhone,
          contact_whatsapp: d.contactPhone,
          contact_email: d.contactEmail,
        })
        .select("id, code")
        .single();
      if (error || !inserted) throw error ?? new Error("insert");

      const propertyId = inserted.id as string;
      const code = inserted.code as string;
      const finalSlug = buildPropertySlug({
        propertyTypeLabel: PROPERTY_TYPE_LABELS[d.propertyType as keyof typeof PROPERTY_TYPE_LABELS],
        bedrooms: d.bedrooms ?? null,
        sector: d.sectorSlug ?? d.citySlug,
        code,
      });
      await admin.from("properties").update({ slug: finalSlug }).eq("id", propertyId);

      if (d.imageUrls.length) {
        await admin.from("property_images").insert(
          d.imageUrls.map((url, idx) => ({
            property_id: propertyId,
            url,
            storage_path: null,
            position: idx,
            is_cover: idx === 0,
          })),
        );
      }
      if (d.amenityKeys.length) {
        await admin.from("property_amenities").insert(d.amenityKeys.map((key) => ({ property_id: propertyId, key })));
        await admin.from("property_features").insert(
          d.amenityKeys.map((key) => ({
            property_id: propertyId,
            key,
            label: AMENITIES_BY_KEY[key]?.label ?? key,
            value: "true",
            group_key: AMENITIES_BY_KEY[key]?.group ?? "edificio",
          })),
        );
      }
      await admin.from("moderation_log").insert({
        entity_type: "property",
        entity_id: propertyId,
        to_state: "PENDING_REVIEW",
        actor_id: user.id,
        reason: "Importación masiva CSV",
      });

      rows.push({ line, ok: true, code, title: d.title });
      created++;
    } catch (err) {
      console.error("[importProperties]", line, err);
      rows.push({ line, ok: false, title: d.title, error: "Error al guardar la fila" });
    }
  }

  if (created > 0) {
    revalidatePath("/agency/dashboard/properties");
    revalidatePath("/admin/properties");
  }

  return {
    ok: created > 0,
    created,
    failed: rows.length - created,
    rows,
    message:
      created === 0
        ? "Ninguna fila se pudo importar. Revisa los errores."
        : `${created} propiedad${created === 1 ? "" : "es"} importada${created === 1 ? "" : "s"} (quedan en revisión).`,
  };
}
