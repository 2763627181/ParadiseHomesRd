import { NextResponse, type NextRequest } from "next/server";

import { isSupabaseConfigured } from "@/lib/env";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const ALLOWED = new Set([
  "page_view",
  "search",
  "property_view",
  "project_view",
  "favorite_added",
  "favorite_removed",
  "share_clicked",
  "whatsapp_clicked",
  "phone_clicked",
  "lead_created",
  "visit_requested",
  "visit_completed",
  "reservation_created",
  "closing_created",
]);

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  const name = typeof body.name === "string" ? body.name : null;
  if (!name || !ALLOWED.has(name)) return new NextResponse(null, { status: 204 });

  if (!isSupabaseConfigured) {
    return new NextResponse(null, { status: 204 });
  }

  const admin = getSupabaseAdminClient();
  if (!admin) return new NextResponse(null, { status: 204 });

  await admin.from("analytics_events").insert({
    name,
    session_id: str(body.session_id),
    user_id: str(body.user_id),
    property_id: str(body.property_id),
    project_id: str(body.project_id),
    lead_id: str(body.lead_id),
    agent_id: str(body.agent_id),
    agency_id: str(body.agency_id),
    path: str(body.path),
    props: (body.props as Record<string, unknown>) ?? {},
    occurred_at: str(body.occurred_at) ?? new Date().toISOString(),
  });

  // "Vistas recientemente": registra la vista de propiedad/proyecto para el
  // usuario en sesión (o la sesión anónima). Un fallo aquí no afecta la respuesta.
  if (name === "property_view" || name === "project_view") {
    const userId = str(body.user_id);
    const sessionId = str(body.session_id);
    const propertyId = str(body.property_id);
    const projectId = str(body.project_id);
    if ((userId || sessionId) && (propertyId || projectId)) {
      try {
        const match: Record<string, string | null> = { property_id: propertyId, project_id: projectId };
        if (userId) match.user_id = userId;
        else match.session_id = sessionId;
        await admin.from("recently_viewed").delete().match(match);
        await admin.from("recently_viewed").insert({
          user_id: userId,
          session_id: userId ? null : sessionId,
          property_id: propertyId,
          project_id: projectId,
          viewed_at: new Date().toISOString(),
        });
      } catch (err) {
        console.error("[events:recently_viewed]", err);
      }
    }
  }

  return new NextResponse(null, { status: 204 });
}

function str(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 && v.length < 500 ? v : null;
}
