"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { toSlug } from "@paradise/utils/slug";

import { getSessionUser, isStaffUser } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export interface BlogActionResult {
  ok: boolean;
  message?: string;
  id?: string;
  slug?: string;
}

const schema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(4, "Título muy corto").max(160),
  slug: z.string().trim().max(160).optional(),
  excerpt: z.string().trim().max(300).optional(),
  body: z.string().trim().max(50000),
  coverImageUrl: z.string().trim().url().optional().or(z.literal("")),
  category: z.string().trim().max(60).optional(),
  tags: z.string().trim().max(300).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
});

function readMinutes(body: string): number {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

async function guard() {
  const user = await getSessionUser();
  if (!isStaffUser(user)) return null;
  return user!;
}

/** Crea o actualiza un artículo del blog (solo staff). */
export async function savePost(input: unknown): Promise<BlogActionResult> {
  const user = await guard();
  if (!user) return { ok: false, message: "No autorizado." };

  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Revisa los datos." };
  const d = parsed.data;

  const admin = getSupabaseAdminClient();
  if (!admin) return { ok: false, message: "Servicio no disponible." };

  const slug = toSlug(d.slug || d.title).slice(0, 150) || `post-${Date.now().toString(36)}`;
  const now = new Date().toISOString();
  const tags = (d.tags ?? "")
    .split(/[,;]/)
    .map((t) => t.trim())
    .filter(Boolean);

  const record: Record<string, unknown> = {
    slug,
    title: d.title,
    excerpt: d.excerpt || null,
    body: d.body,
    cover_image_url: d.coverImageUrl || null,
    category: d.category || null,
    tags,
    author_name: user.fullName,
    author_id: user.id,
    read_minutes: readMinutes(d.body),
    status: d.status,
    published_at: d.status === "PUBLISHED" ? now : null,
    updated_at: now,
  };

  let result;
  if (d.id) {
    // no re-publiques con fecha nueva si ya estaba publicado
    if (d.status === "PUBLISHED") {
      const { data: prev } = await admin.from("blog_posts").select("published_at").eq("id", d.id).maybeSingle();
      if (prev?.published_at) record.published_at = prev.published_at;
    }
    result = await admin.from("blog_posts").update(record).eq("id", d.id).select("id, slug").single();
  } else {
    result = await admin.from("blog_posts").insert(record).select("id, slug").single();
  }

  if (result.error) {
    if (/does not exist|relation/.test(result.error.message)) {
      return { ok: false, message: "El blog no está habilitado. Ejecuta la migración 0013." };
    }
    if (/duplicate key|unique/.test(result.error.message)) {
      return { ok: false, message: `Ya existe un artículo con el slug "${slug}".` };
    }
    return { ok: false, message: result.error.message };
  }

  revalidatePath("/admin/content");
  revalidatePath("/blog");
  revalidatePath(`/blog/${result.data.slug}`);
  return { ok: true, id: result.data.id, slug: result.data.slug, message: "Guardado." };
}

export async function deletePost(id: string): Promise<BlogActionResult> {
  const user = await guard();
  if (!user) return { ok: false, message: "No autorizado." };
  const admin = getSupabaseAdminClient();
  if (!admin) return { ok: false, message: "Servicio no disponible." };
  const { error } = await admin.from("blog_posts").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin/content");
  revalidatePath("/blog");
  return { ok: true, message: "Artículo eliminado." };
}
