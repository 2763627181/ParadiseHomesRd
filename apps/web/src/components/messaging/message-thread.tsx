"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon, SendIcon } from "lucide-react";
import { toast } from "sonner";
import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import { formatDateRd, formatTimeRd } from "@paradise/utils/datetime";
import { initials } from "@paradise/utils/format";

import { cn } from "@/lib/utils";
import { fetchMessages, markConversationRead, sendMessage } from "@/lib/actions/messaging";
import type { ChatMessage } from "@/lib/data/messaging";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const POLL_MS = 5000;
/** mensajes consecutivos del mismo remitente dentro de esta ventana se agrupan */
const GROUP_WINDOW_MS = 5 * 60 * 1000;

export function messagesQueryKey(conversationId: string) {
  return ["messages", conversationId] as const;
}

interface MessageGroup {
  key: string;
  senderId: string | null;
  mine: boolean;
  messages: ChatMessage[];
}

interface DaySection {
  day: string;
  label: string;
  groups: MessageGroup[];
}

function dayKey(iso: string) {
  return formatDateRd(iso);
}

function dayLabel(iso: string, now = new Date()) {
  const today = formatDateRd(now);
  const yesterday = formatDateRd(new Date(now.getTime() - 86_400_000));
  const d = formatDateRd(iso);
  if (d === today) return "Hoy";
  if (d === yesterday) return "Ayer";
  return d;
}

function groupMessages(messages: ChatMessage[], viewerId: string | null): DaySection[] {
  const sections: DaySection[] = [];
  for (const m of messages) {
    const day = dayKey(m.createdAt);
    let section = sections[sections.length - 1];
    if (!section || section.day !== day) {
      section = { day, label: dayLabel(m.createdAt), groups: [] };
      sections.push(section);
    }
    const last = section.groups[section.groups.length - 1];
    const lastMsg = last?.messages[last.messages.length - 1];
    const sameSender = last && last.senderId === m.senderId;
    const closeInTime =
      lastMsg && new Date(m.createdAt).getTime() - new Date(lastMsg.createdAt).getTime() < GROUP_WINDOW_MS;
    if (last && sameSender && closeInTime) {
      last.messages.push(m);
    } else {
      section.groups.push({
        key: m.id,
        senderId: m.senderId,
        mine: viewerId != null && m.senderId === viewerId,
        messages: [m],
      });
    }
  }
  return sections;
}

function mergeMessages(base: ChatMessage[], extra: ChatMessage[]): ChatMessage[] {
  if (extra.length === 0) return base;
  const seen = new Set(base.map((m) => m.id));
  const out = [...base];
  for (const m of extra) if (!seen.has(m.id)) out.push(m);
  return out;
}

/**
 * Hilo de conversación: lista de mensajes (agrupados por remitente y día,
 * con autoscroll) + redactor. Se mantiene al día por polling (TanStack Query)
 * y, cuando la tabla `messages` está en la publicación Realtime, también por
 * suscripción — cualquiera de las dos vías invalida la misma query.
 */
export function MessageThread({
  conversationId,
  viewerId,
  initialMessages,
  counterpartName,
  counterpartAvatarUrl,
  className,
}: {
  conversationId: string;
  /** perfil del usuario en sesión; `null` = solo lectura (vista de ejemplo) */
  viewerId: string | null;
  initialMessages: ChatMessage[];
  counterpartName: string;
  counterpartAvatarUrl?: string | null;
  className?: string;
}) {
  const queryClient = useQueryClient();
  const queryKey = messagesQueryKey(conversationId);

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await fetchMessages(conversationId);
      if (!res.ok) throw new Error(res.message ?? "No se pudieron cargar los mensajes");
      return res.messages;
    },
    initialData: initialMessages,
    refetchInterval: POLL_MS,
    refetchOnWindowFocus: true,
    enabled: viewerId != null,
  });

  // Mensajes optimistas (aún sin confirmar por el servidor).
  const [pendingMessages, setPendingMessages] = React.useState<ChatMessage[]>([]);
  const [draft, setDraft] = React.useState("");
  const [sending, setSending] = React.useState(false);

  const serverMessages = React.useMemo(() => query.data ?? [], [query.data]);
  const messages = React.useMemo(
    () => mergeMessages(serverMessages, pendingMessages),
    [serverMessages, pendingMessages],
  );
  const sections = React.useMemo(() => groupMessages(messages, viewerId), [messages, viewerId]);

  // Realtime: cualquier INSERT en esta conversación refresca la query. Si el
  // cliente no existe (modo demo) o la suscripción falla, el polling sigue.
  React.useEffect(() => {
    if (!viewerId) return;
    let supabase: SupabaseClient | null = null;
    let channel: RealtimeChannel | null = null;
    try {
      supabase = getSupabaseBrowserClient();
      if (!supabase) return;
      channel = supabase
        .channel(`messages:${conversationId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `conversation_id=eq.${conversationId}`,
          },
          () => {
            void queryClient.invalidateQueries({ queryKey: messagesQueryKey(conversationId) });
          },
        )
        .subscribe();
    } catch (err) {
      console.warn("[MessageThread] realtime no disponible", err);
    }
    return () => {
      if (supabase && channel) {
        try {
          void supabase.removeChannel(channel);
        } catch {
          // ignorar
        }
      }
    };
  }, [conversationId, viewerId, queryClient]);

  // Marcar como leídos los mensajes ajenos cuando llegan / al abrir el hilo.
  const unreadFromOthers = React.useMemo(
    () => serverMessages.filter((m) => m.readAt == null && m.senderId !== viewerId).length,
    [serverMessages, viewerId],
  );
  React.useEffect(() => {
    if (!viewerId || unreadFromOthers === 0) return;
    void markConversationRead(conversationId).then((res) => {
      if (res.ok) {
        queryClient.setQueryData<ChatMessage[]>(messagesQueryKey(conversationId), (old) =>
          (old ?? []).map((m) =>
            m.readAt == null && m.senderId !== viewerId
              ? { ...m, readAt: new Date().toISOString() }
              : m,
          ),
        );
      }
    });
  }, [conversationId, viewerId, unreadFromOthers, queryClient]);

  // Autoscroll al último mensaje.
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const lastId = messages[messages.length - 1]?.id;
  React.useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lastId]);

  const submit = async () => {
    const body = draft.trim();
    if (!body || !viewerId || sending) return;

    const optimistic: ChatMessage = {
      id: `optimistic-${Date.now()}`,
      conversationId,
      senderId: viewerId,
      body,
      readAt: null,
      createdAt: new Date().toISOString(),
    };
    setPendingMessages((prev) => [...prev, optimistic]);
    setDraft("");
    setSending(true);

    try {
      const res = await sendMessage(conversationId, body);
      if (res.ok && res.sent) {
        const sent = res.sent;
        queryClient.setQueryData<ChatMessage[]>(messagesQueryKey(conversationId), (old) =>
          mergeMessages(old ?? [], [sent]),
        );
      } else {
        toast.error(res.message ?? "No pudimos enviar el mensaje");
        setDraft(body);
      }
    } catch {
      toast.error("No pudimos enviar el mensaje");
      setDraft(body);
    } finally {
      setPendingMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setSending(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void submit();
    }
  };

  return (
    <div className={cn("flex min-h-0 flex-col rounded-xl border border-border/70 bg-card", className)}>
      <div
        ref={scrollRef}
        className="flex-1 space-y-5 overflow-y-auto px-4 py-4 sm:px-5"
        role="log"
        aria-live="polite"
        aria-label={`Conversación con ${counterpartName}`}
      >
        {messages.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Todavía no hay mensajes. Escribe el primero para iniciar la conversación.
          </p>
        )}

        {sections.map((section) => (
          <div key={section.day} className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-border/70" />
              <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {section.label}
              </span>
              <span className="h-px flex-1 bg-border/70" />
            </div>

            {section.groups.map((group) => (
              <div
                key={group.key}
                className={cn("flex items-end gap-2", group.mine ? "flex-row-reverse" : "flex-row")}
              >
                {!group.mine && (
                  <Avatar className="size-7">
                    {counterpartAvatarUrl && <AvatarImage src={counterpartAvatarUrl} alt="" />}
                    <AvatarFallback className="text-[10px]">{initials(counterpartName)}</AvatarFallback>
                  </Avatar>
                )}
                <div className={cn("flex max-w-[80%] flex-col gap-1", group.mine ? "items-end" : "items-start")}>
                  {group.messages.map((m, i) => {
                    const isLast = i === group.messages.length - 1;
                    const isPending = m.id.startsWith("optimistic-");
                    return (
                      <div key={m.id} className={cn("flex flex-col", group.mine ? "items-end" : "items-start")}>
                        <div
                          className={cn(
                            "whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm",
                            group.mine
                              ? "rounded-br-md bg-primary text-primary-foreground"
                              : "rounded-bl-md bg-secondary text-foreground",
                            isPending && "opacity-70",
                          )}
                        >
                          {m.body}
                        </div>
                        {isLast && (
                          <span className="mt-0.5 px-1 text-[10px] text-muted-foreground">
                            {isPending ? "Enviando…" : formatTimeRd(m.createdAt)}
                            {group.mine && !isPending && m.readAt ? " · Leído" : ""}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="border-t border-border/70 p-3">
        {viewerId ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
            className="flex items-end gap-2"
          >
            <Textarea
              rows={1}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={`Escribe a ${counterpartName}…`}
              aria-label="Mensaje"
              maxLength={4000}
              className="max-h-40 min-h-10 flex-1 resize-none py-2"
            />
            <Button
              type="submit"
              size="icon"
              disabled={sending || !draft.trim()}
              aria-label="Enviar"
              className="shrink-0"
            >
              {sending ? <Loader2Icon className="size-4 animate-spin" /> : <SendIcon className="size-4" />}
            </Button>
          </form>
        ) : (
          <p className="text-center text-xs text-muted-foreground">Inicia sesión para responder.</p>
        )}
        {viewerId && (
          <p className="mt-1.5 px-1 text-[11px] text-muted-foreground">
            Enter para enviar · Shift+Enter para salto de línea
          </p>
        )}
      </div>
    </div>
  );
}
