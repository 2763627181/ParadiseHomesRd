"use server";

import { randomUUID } from "node:crypto";

import { env, isSupabaseConfigured } from "@/lib/env";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export interface UploadTicket {
  ok: boolean;
  path?: string;
  token?: string;
  publicUrl?: string;
  bucket?: string;
  message?: string;
}

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const MAX_BYTES = 15 * 1024 * 1024;

/**
 * Crea una URL firmada para subir una imagen directamente a Supabase Storage
 * (sin pasar por el servidor de la app). Se usa en el wizard de publicación.
 */
export async function createUploadUrl(input: {
  fileName: string;
  contentType: string;
  size: number;
  prefix?: "listings" | "projects" | "org" | "avatars";
}): Promise<UploadTicket> {
  if (!isSupabaseConfigured) {
    return { ok: false, message: "El almacenamiento no está disponible en modo demo." };
  }
  if (!ALLOWED.has(input.contentType)) {
    return { ok: false, message: "Formato no permitido. Usa JPG, PNG, WebP o AVIF." };
  }
  if (input.size > MAX_BYTES) {
    return { ok: false, message: "La imagen supera los 15 MB." };
  }

  const admin = getSupabaseAdminClient();
  if (!admin) return { ok: false, message: "Servicio no disponible." };

  const bucket =
    input.prefix === "projects"
      ? "project-media"
      : input.prefix === "org"
        ? "org-media"
        : input.prefix === "avatars"
          ? "avatars"
          : "property-media";

  const ext = input.fileName.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${input.prefix ?? "listings"}/${randomUUID()}.${ext}`;

  const { data, error } = await admin.storage.from(bucket).createSignedUploadUrl(path);
  if (error || !data) {
    console.error("[createUploadUrl]", error);
    return { ok: false, message: "No pudimos preparar la subida." };
  }

  const publicUrl = `${env.SUPABASE_URL!.replace(/\/$/, "")}/storage/v1/object/public/${bucket}/${path}`;

  return { ok: true, path, token: data.token, publicUrl, bucket };
}
