"use server";

import { revalidatePath } from "next/cache";
import type { SessionUser } from "@paradise/types";

import { getSessionUser, isStaffUser } from "@/lib/auth";
import { getMessages, messagePreview, type ChatMessage } from "@/lib/data/messaging";
import { notifyAgent, notifyUser } from "@/lib/notify";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export interface MessagingResult {
  ok: boolean;
  message?: string;
}

export interface StartConversationResult extends MessagingResult {
  conversationId?: string;
}

export interface SendMessageResult extends MessagingResult {
  sent?: ChatMessage;
}

export interface FetchMessagesResult extends MessagingResult {
  messages: ChatMessage[];
}

const MAX_BODY = 4000;

interface ConversationRow {
  id: string;
  lead_id: string | null;
  property_id: string | null;
  buyer_id: string | null;
  agent_id: string | null;
  agent: { profile_id: string | null; full_name: string | null } | null;
}

/**
 * Carga la conversación y decide si el usuario en sesión puede verla:
 * staff, el cliente (`buyer_id`) o el asesor asignado (`agent_id`).
 */
async function loadConversationForUser(conversationId: string): Promise<{
  user: SessionUser | null;
  admin: ReturnType<typeof getSupabaseAdminClient>;
  conv: ConversationRow | null;
  allowed: boolean;
}> {
  const user = await getSessionUser();
  if (!user) return { user: null, admin: null, conv: null, allowed: false };

  const admin = getSupabaseAdminClient();
  if (!admin) return { user, admin, conv: null, allowed: false };

  const { data } = await admin
    .from("conversations")
    .select("id, lead_id, property_id, buyer_id, agent_id, agent:agents(profile_id, full_name)")
    .eq("id", conversationId)
    .maybeSingle();
  if (!data) return { user, admin, conv: null, allowed: false };

  const conv = data as unknown as ConversationRow;
  const allowed =
    isStaffUser(user) ||
    conv.buyer_id === user.id ||
    (user.agentId != null && conv.agent_id === user.agentId);
  return { user, admin, conv, allowed };
}

function revalidateInboxes(conversationId: string) {
  revalidatePath("/agent/dashboard/messages");
  revalidatePath(`/agent/dashboard/messages/${conversationId}`);
  revalidatePath("/dashboard/messages");
  revalidatePath(`/dashboard/messages/${conversationId}`);
}

/**
 * Devuelve la conversación ligada a un lead, creándola si no existe.
 * Puede llamarla el staff, el asesor del lead o el cliente dueño del contacto.
 */
export async function getOrCreateConversationForLead(leadId: string): Promise<StartConversationResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, message: "Inicia sesión para enviar mensajes." };

  const admin = getSupabaseAdminClient();
  if (!admin) return { ok: false, message: "Servicio no disponible." };

  const { data: lead, error: leadError } = await admin
    .from("leads")
    .select("id, property_id, agent_id, contact:contacts(id, profile_id, email)")
    .eq("id", leadId)
    .maybeSingle();
  if (leadError || !lead) return { ok: false, message: "No encontramos la consulta." };

  const l: any = lead;
  const contact = l.contact as { id: string; profile_id: string | null; email: string | null } | null;

  const isOwnLead = user.agentId != null && l.agent_id === user.agentId;
  const isBuyer = contact?.profile_id != null && contact.profile_id === user.id;
  if (!(isStaffUser(user) || isOwnLead || isBuyer)) return { ok: false, message: "No autorizado." };

  const { data: existing } = await admin
    .from("conversations")
    .select("id")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (existing?.id) return { ok: true, conversationId: existing.id as string };

  // buyer_id: perfil del contacto; si el lead fue anónimo, intentamos casarlo
  // por correo con un perfil existente (y de paso enlazamos el contacto).
  let buyerId: string | null = contact?.profile_id ?? null;
  if (!buyerId && contact?.email) {
    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .ilike("email", contact.email)
      .limit(1)
      .maybeSingle();
    if (profile?.id) {
      buyerId = profile.id as string;
      await admin.from("contacts").update({ profile_id: buyerId }).eq("id", contact.id).is("profile_id", null);
    }
  }

  const { data: created, error: createError } = await admin
    .from("conversations")
    .insert({
      lead_id: l.id,
      property_id: l.property_id ?? null,
      agent_id: l.agent_id ?? null,
      buyer_id: buyerId,
    })
    .select("id")
    .single();
  if (createError || !created) {
    console.error("[getOrCreateConversationForLead]", createError?.message);
    return { ok: false, message: "No pudimos abrir la conversación." };
  }

  revalidateInboxes(created.id as string);
  return { ok: true, conversationId: created.id as string };
}

/** Envía un mensaje como el usuario en sesión y avisa al otro participante. */
export async function sendMessage(conversationId: string, body: string): Promise<SendMessageResult> {
  const text = body.trim();
  if (!text) return { ok: false, message: "Escribe un mensaje." };
  if (text.length > MAX_BODY) return { ok: false, message: `El mensaje no puede superar ${MAX_BODY} caracteres.` };

  const { user, admin, conv, allowed } = await loadConversationForUser(conversationId);
  if (!user) return { ok: false, message: "Inicia sesión para enviar mensajes." };
  if (!allowed || !admin || !conv) return { ok: false, message: "No autorizado." };

  const { data: inserted, error } = await admin
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: user.id, body: text })
    .select("id, conversation_id, sender_id, body, read_at, created_at")
    .single();
  if (error || !inserted) {
    console.error("[sendMessage]", error?.message);
    return { ok: false, message: "No pudimos enviar el mensaje. Intenta de nuevo." };
  }

  const sent: ChatMessage = {
    id: inserted.id,
    conversationId: inserted.conversation_id,
    senderId: inserted.sender_id,
    body: inserted.body,
    readAt: inserted.read_at,
    createdAt: inserted.created_at,
  };

  await admin.from("conversations").update({ last_message_at: sent.createdAt }).eq("id", conversationId);

  // Avisar al otro participante (nunca al propio remitente). Un fallo aquí no
  // invalida el envío.
  try {
    const preview = messagePreview(text, 140);
    const title = `Nuevo mensaje de ${user.fullName}`;
    const senderIsAgent = conv.agent?.profile_id != null && conv.agent.profile_id === user.id;

    if (conv.buyer_id && conv.buyer_id !== user.id) {
      await notifyUser({
        userId: conv.buyer_id,
        type: "message_new",
        title,
        body: preview,
        payload: { conversationId, href: `/dashboard/messages/${conversationId}` },
        email: true,
      });
    }
    if (conv.agent_id && conv.agent?.profile_id !== user.id) {
      await notifyAgent(conv.agent_id, {
        type: "message_new",
        title,
        body: preview,
        payload: { conversationId, href: `/agent/dashboard/messages/${conversationId}` },
        email: true,
      });
    }

    // Deja rastro en el timeline del lead cuando responde el cliente.
    if (conv.lead_id && !senderIsAgent && conv.buyer_id === user.id) {
      await admin.from("lead_activities").insert({
        lead_id: conv.lead_id,
        type: "client_replied",
        title: `${user.fullName} escribió por mensajería`,
        body: preview,
        actor_id: user.id,
        actor_name: user.fullName,
        metadata: { conversationId },
      });
    }
  } catch (err) {
    console.error("[sendMessage] notify", err);
  }

  revalidateInboxes(conversationId);
  return { ok: true, sent };
}

/** Marca como leídos los mensajes de la conversación que no envió el usuario en sesión. */
export async function markConversationRead(conversationId: string): Promise<MessagingResult> {
  const { user, admin, allowed } = await loadConversationForUser(conversationId);
  if (!user) return { ok: false, message: "Inicia sesión." };
  if (!allowed || !admin) return { ok: false, message: "No autorizado." };

  const { error } = await admin
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .is("read_at", null)
    .or(`sender_id.neq.${user.id},sender_id.is.null`);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/agent/dashboard/messages");
  revalidatePath("/dashboard/messages");
  return { ok: true };
}

/** Lectura de mensajes para el polling del hilo (usa la misma autorización que el envío). */
export async function fetchMessages(conversationId: string, after?: string): Promise<FetchMessagesResult> {
  const { user, allowed } = await loadConversationForUser(conversationId);
  if (!user) return { ok: false, message: "Inicia sesión.", messages: [] };
  if (!allowed) return { ok: false, message: "No autorizado.", messages: [] };
  const messages = await getMessages(conversationId, { after });
  return { ok: true, messages };
}
