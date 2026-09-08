import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/server";


export interface AgentReview {
  id: string;
  agentId: string;
  authorId: string | null;
  authorName: string;
  rating: number;
  title: string | null;
  body: string;
  createdAt: string;
}

function mapReview(row: any): AgentReview {
  return {
    id: row.id,
    agentId: row.agent_id,
    authorId: row.author_id ?? null,
    authorName: row.author_name,
    rating: row.rating,
    title: row.title ?? null,
    body: row.body,
    createdAt: row.created_at,
  };
}

/** Reseñas publicadas de un asesor (más recientes primero). */
export async function getAgentReviews(agentId: string, limit = 20): Promise<AgentReview[]> {
  const admin = getSupabaseAdminClient();
  if (!admin) return [];
  const { data, error } = await admin
    .from("agent_reviews")
    .select("id, agent_id, author_id, author_name, rating, title, body, created_at")
    .eq("agent_id", agentId)
    .eq("status", "PUBLISHED")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    // La tabla puede no existir aún (migración 0012 pendiente).
    if (!/does not exist|relation/.test(error.message)) console.error("[getAgentReviews]", error.message);
    return [];
  }
  return (data ?? []).map(mapReview);
}

/** ¿Este usuario ya reseñó a este asesor? Devuelve la reseña o null. */
export async function getMyReviewForAgent(agentId: string, userId: string): Promise<AgentReview | null> {
  const admin = getSupabaseAdminClient();
  if (!admin) return null;
  const { data, error } = await admin
    .from("agent_reviews")
    .select("id, agent_id, author_id, author_name, rating, title, body, created_at")
    .eq("agent_id", agentId)
    .eq("author_id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return mapReview(data);
}

/** ¿El usuario tuvo contacto con este asesor (lead)? Habilita dejar reseña. */
export async function userWorkedWithAgent(agentId: string, userId: string): Promise<boolean> {
  const admin = getSupabaseAdminClient();
  if (!admin) return false;
  const { data } = await admin
    .from("leads")
    .select("id, contact:contacts!inner(profile_id)")
    .eq("agent_id", agentId)
    .eq("contact.profile_id", userId)
    .limit(1);
  return (data ?? []).length > 0;
}
