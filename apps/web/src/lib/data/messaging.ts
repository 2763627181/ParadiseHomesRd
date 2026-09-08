import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/server";

/* ─────────────────────────────────────────────────────────────────────────────
 * Capa de datos de mensajería cliente ↔ asesor.
 *
 * Siempre con el cliente admin (omite RLS): la autorización la hace quien
 * llama (páginas/acciones comprueban que el usuario sea participante o staff)
 * — igual que `lib/data/leads.ts`. El cliente del navegador solo se usa para
 * la suscripción Realtime, donde RLS sí filtra por participante.
 * ───────────────────────────────────────────────────────────────────────────── */

export interface ConversationSummary {
  id: string;
  leadId: string | null;
  propertyId: string | null;
  propertyTitle: string | null;
  propertySlug: string | null;
  /** nombre del "otro" participante según la vista (asesor para el cliente, cliente para el asesor) */
  counterpartName: string;
  counterpartAvatarUrl: string | null;
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  createdAt: string;
}

export interface ConversationDetail {
  id: string;
  leadId: string | null;
  leadCode: string | null;
  propertyId: string | null;
  propertyTitle: string | null;
  propertySlug: string | null;
  buyerId: string | null;
  buyerName: string;
  buyerAvatarUrl: string | null;
  agentId: string | null;
  agentProfileId: string | null;
  agentName: string;
  agentAvatarUrl: string | null;
  lastMessageAt: string | null;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string | null;
  body: string;
  readAt: string | null;
  createdAt: string;
}

const CONVERSATION_SELECT = `
  id, lead_id, property_id, buyer_id, agent_id, last_message_at, created_at,
  property:properties(title, slug),
  buyer:profiles(full_name, avatar_url),
  agent:agents(full_name, avatar_url, profile_id),
  lead:leads(lead_code, contact:contacts(full_name)),
  messages(body, created_at, sender_id)
`;

const PREVIEW_LENGTH = 90;

export function messagePreview(body: string | null | undefined, max = PREVIEW_LENGTH): string | null {
  if (!body) return null;
  const flat = body.replace(/\s+/g, " ").trim();
  if (!flat) return null;
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat;
}

function buyerDisplayName(row: any): string {
  return row.lead?.contact?.full_name ?? row.buyer?.full_name ?? "Cliente";
}

function agentDisplayName(row: any): string {
  return row.agent?.full_name ?? "Asesor";
}

function mapSummary(row: any, view: "agent" | "buyer", unreadCount: number): ConversationSummary {
  // `messages` viene ordenado desc y limitado a 1 (ver `listConversations`).
  const last = Array.isArray(row.messages) ? row.messages[0] : row.messages;
  return {
    id: row.id,
    leadId: row.lead_id,
    propertyId: row.property_id,
    propertyTitle: row.property?.title ?? null,
    propertySlug: row.property?.slug ?? null,
    counterpartName: view === "agent" ? buyerDisplayName(row) : agentDisplayName(row),
    counterpartAvatarUrl:
      view === "agent" ? (row.buyer?.avatar_url ?? null) : (row.agent?.avatar_url ?? null),
    lastMessagePreview: messagePreview(last?.body),
    lastMessageAt: last?.created_at ?? row.last_message_at ?? null,
    unreadCount,
    createdAt: row.created_at,
  };
}

function mapMessage(row: any): ChatMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    body: row.body,
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}

/**
 * Mensajes sin leer por conversación, desde el punto de vista de `viewerId`
 * (mensajes con `read_at is null` que NO envió el propio usuario). Un mensaje
 * sin remitente (perfil borrado) cuenta como del otro participante.
 */
async function getUnreadByConversation(
  conversationIds: string[],
  viewerId: string | null,
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (conversationIds.length === 0) return counts;
  const admin = getSupabaseAdminClient();
  if (!admin) return counts;

  let query = admin
    .from("messages")
    .select("conversation_id")
    .in("conversation_id", conversationIds)
    .is("read_at", null)
    .limit(5000);
  if (viewerId) query = query.or(`sender_id.neq.${viewerId},sender_id.is.null`);

  const { data, error } = await query;
  if (error) {
    console.error("[getUnreadByConversation]", error.message);
    return counts;
  }
  for (const row of data ?? []) {
    const id = (row as any).conversation_id as string;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return counts;
}

async function listConversations(
  filter: { column: "agent_id" | "buyer_id"; value: string },
  view: "agent" | "buyer",
  viewerId: string | null,
): Promise<ConversationSummary[]> {
  const admin = getSupabaseAdminClient();
  if (!admin) return [];

  const { data, error } = await admin
    .from("conversations")
    .select(CONVERSATION_SELECT)
    .eq(filter.column, filter.value)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .order("created_at", { referencedTable: "messages", ascending: false })
    .limit(1, { referencedTable: "messages" })
    .limit(200);

  if (error) {
    console.error("[listConversations]", error.message);
    return [];
  }

  const rows = data ?? [];
  const unread = await getUnreadByConversation(
    rows.map((r: any) => r.id as string),
    viewerId,
  );
  return rows.map((row: any) => mapSummary(row, view, unread.get(row.id) ?? 0));
}

/** Bandeja del asesor. `viewerId` es el perfil del asesor (para el conteo de no leídos); si no se pasa, se resuelve desde `agents.profile_id`. */
export async function getConversationsForAgent(
  agentId: string,
  viewerId?: string | null,
): Promise<ConversationSummary[]> {
  let me = viewerId ?? null;
  if (!me) {
    const admin = getSupabaseAdminClient();
    if (!admin) return [];
    const { data } = await admin.from("agents").select("profile_id").eq("id", agentId).maybeSingle();
    me = (data?.profile_id as string | null | undefined) ?? null;
  }
  return listConversations({ column: "agent_id", value: agentId }, "agent", me);
}

/** Bandeja del cliente (comprador/inquilino). */
export async function getConversationsForBuyer(userId: string): Promise<ConversationSummary[]> {
  return listConversations({ column: "buyer_id", value: userId }, "buyer", userId);
}

export async function getConversation(id: string): Promise<ConversationDetail | null> {
  const admin = getSupabaseAdminClient();
  if (!admin) return null;

  const { data: row, error } = await admin
    .from("conversations")
    .select(
      `
      id, lead_id, property_id, buyer_id, agent_id, last_message_at, created_at,
      property:properties(title, slug),
      buyer:profiles(full_name, avatar_url),
      agent:agents(full_name, avatar_url, profile_id),
      lead:leads(lead_code, contact:contacts(full_name))
    `,
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !row) {
    if (error) console.error("[getConversation]", error.message);
    return null;
  }

  const r: any = row;
  return {
    id: r.id,
    leadId: r.lead_id,
    leadCode: r.lead?.lead_code ?? null,
    propertyId: r.property_id,
    propertyTitle: r.property?.title ?? null,
    propertySlug: r.property?.slug ?? null,
    buyerId: r.buyer_id,
    buyerName: buyerDisplayName(r),
    buyerAvatarUrl: r.buyer?.avatar_url ?? null,
    agentId: r.agent_id,
    agentProfileId: r.agent?.profile_id ?? null,
    agentName: agentDisplayName(r),
    agentAvatarUrl: r.agent?.avatar_url ?? null,
    lastMessageAt: r.last_message_at,
    createdAt: r.created_at,
  };
}

/** Mensajes de una conversación en orden cronológico. `after` (ISO) devuelve solo los posteriores. */
export async function getMessages(
  conversationId: string,
  opts: { after?: string; limit?: number } = {},
): Promise<ChatMessage[]> {
  const admin = getSupabaseAdminClient();
  if (!admin) return [];

  let query = admin
    .from("messages")
    .select("id, conversation_id, sender_id, body, read_at, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(opts.limit ?? 500);
  if (opts.after) query = query.gt("created_at", opts.after);

  const { data, error } = await query;
  if (error) {
    console.error("[getMessages]", error.message);
    return [];
  }
  return (data ?? []).map(mapMessage);
}

/** No leídos de una sola conversación desde el punto de vista de `viewerId`. */
export async function getUnreadCountForConversation(
  conversationId: string,
  viewerId: string | null,
): Promise<number> {
  const counts = await getUnreadByConversation([conversationId], viewerId);
  return counts.get(conversationId) ?? 0;
}

/**
 * Total de mensajes sin leer del usuario en todas sus conversaciones (como
 * cliente y, si es asesor, también como asesor). Útil para badges en el nav.
 */
export async function getUnreadMessageCount(viewer: {
  userId: string;
  agentId?: string | null;
}): Promise<number> {
  const admin = getSupabaseAdminClient();
  if (!admin) return 0;

  const filter = viewer.agentId
    ? `buyer_id.eq.${viewer.userId},agent_id.eq.${viewer.agentId}`
    : `buyer_id.eq.${viewer.userId}`;
  const { data, error } = await admin.from("conversations").select("id").or(filter).limit(500);
  if (error) {
    console.error("[getUnreadMessageCount]", error.message);
    return 0;
  }
  const ids = (data ?? []).map((r: any) => r.id as string);
  const counts = await getUnreadByConversation(ids, viewer.userId);
  let total = 0;
  for (const n of counts.values()) total += n;
  return total;
}

/**
 * Igual que `getUnreadMessageCount` pero resolviendo el `agentId` a partir del
 * perfil, para llamarlo desde endpoints ligeros que solo tienen `user.id`.
 */
export async function getUnreadMessageCountForProfile(userId: string): Promise<number> {
  const admin = getSupabaseAdminClient();
  if (!admin) return 0;
  const { data: agent } = await admin
    .from("agents")
    .select("id")
    .eq("profile_id", userId)
    .maybeSingle();
  return getUnreadMessageCount({ userId, agentId: (agent as any)?.id ?? null });
}
