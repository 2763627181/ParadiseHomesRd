"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getSessionUser } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { notifyAgent } from "@/lib/notify";

export interface ReviewActionResult {
  ok: boolean;
  message?: string;
}

const schema = z.object({
  agentId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional(),
  body: z.string().trim().min(15, "Cuéntanos un poco más (mín. 15 caracteres).").max(2000),
});

/** Crea o actualiza la reseña del usuario en sesión sobre un asesor. */
export async function submitAgentReview(input: unknown): Promise<ReviewActionResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Revisa los datos." };
  }
  const { agentId, rating, title, body } = parsed.data;

  const user = await getSessionUser();
  if (!user) return { ok: false, message: "Inicia sesión para dejar una reseña." };

  const admin = getSupabaseAdminClient();
  if (!admin) return { ok: false, message: "Servicio no disponible." };

  const { data: agent } = await admin.from("agents").select("id, slug, full_name").eq("id", agentId).maybeSingle();
  if (!agent) return { ok: false, message: "Asesor no encontrado." };

  const { data: existing } = await admin
    .from("agent_reviews")
    .select("id")
    .eq("agent_id", agentId)
    .eq("author_id", user.id)
    .maybeSingle();

  const payload = {
    agent_id: agentId,
    author_id: user.id,
    author_name: user.fullName,
    rating,
    title: title || null,
    body,
    status: "PUBLISHED" as const,
    updated_at: new Date().toISOString(),
  };

  const { error } = existing
    ? await admin.from("agent_reviews").update(payload).eq("id", existing.id)
    : await admin.from("agent_reviews").insert(payload);

  if (error) {
    if (/does not exist|relation/.test(error.message)) {
      return { ok: false, message: "Las reseñas aún no están habilitadas. Ejecuta la migración 0012." };
    }
    return { ok: false, message: error.message };
  }

  if (!existing) {
    try {
      await notifyAgent(agentId, {
        type: "review_received",
        title: `${user.fullName} te dejó una reseña (${rating}★)`,
        body: title || body.slice(0, 120),
        payload: { href: `/agent/${agent.slug}` },
      });
    } catch (err) {
      console.error("[submitAgentReview:notify]", err);
    }
  }

  revalidatePath(`/agent/${agent.slug}`);
  return { ok: true, message: existing ? "Reseña actualizada." : "¡Gracias por tu reseña!" };
}
