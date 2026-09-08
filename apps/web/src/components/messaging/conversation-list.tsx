import Link from "next/link";
import { MessagesSquareIcon } from "lucide-react";
import { formatRelativeRd } from "@paradise/utils/datetime";
import { initials } from "@paradise/utils/format";

import { cn } from "@/lib/utils";
import type { ConversationSummary } from "@/lib/data/messaging";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EmptyState } from "@/components/common/empty-state";

/**
 * Lista de conversaciones (bandeja). Server-friendly: no usa hooks, solo
 * enlaces; cada fila lleva al hilo bajo `basePath`.
 */
export function ConversationList({
  conversations,
  basePath,
  activeId,
  emptyTitle = "Aún no tienes conversaciones",
  emptyDescription = "Cuando envíes o recibas un mensaje, aparecerá aquí.",
  compact = false,
  className,
}: {
  conversations: ConversationSummary[];
  /** "/agent/dashboard/messages" o "/dashboard/messages" */
  basePath: string;
  activeId?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  /** versión estrecha para la columna lateral del hilo */
  compact?: boolean;
  className?: string;
}) {
  if (conversations.length === 0) {
    return compact ? (
      <p className={cn("px-3 py-6 text-center text-xs text-muted-foreground", className)}>{emptyTitle}</p>
    ) : (
      <EmptyState
        icon={MessagesSquareIcon}
        title={emptyTitle}
        description={emptyDescription}
        className={className}
      />
    );
  }

  return (
    <ul className={cn("divide-y divide-border/70 overflow-hidden rounded-xl border border-border/70 bg-card", className)}>
      {conversations.map((c) => {
        const active = c.id === activeId;
        const unread = c.unreadCount > 0;
        return (
          <li key={c.id}>
            <Link
              href={`${basePath}/${c.id}`}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-start gap-3 px-3 py-3 transition-colors hover:bg-secondary/60",
                compact ? "px-3" : "sm:px-4",
                active && "bg-secondary",
              )}
            >
              <Avatar className={compact ? "size-9" : "size-10"}>
                {c.counterpartAvatarUrl && <AvatarImage src={c.counterpartAvatarUrl} alt="" />}
                <AvatarFallback className="text-xs">{initials(c.counterpartName)}</AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className={cn("truncate text-sm", unread ? "font-semibold" : "font-medium")}>
                    {c.counterpartName}
                  </p>
                  {c.lastMessageAt && (
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {formatRelativeRd(c.lastMessageAt)}
                    </span>
                  )}
                </div>
                {c.propertyTitle && (
                  <p className="truncate text-xs text-muted-foreground">{c.propertyTitle}</p>
                )}
                <div className="mt-0.5 flex items-center justify-between gap-2">
                  <p
                    className={cn(
                      "truncate text-xs",
                      unread ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {c.lastMessagePreview ?? "Sin mensajes todavía"}
                  </p>
                  {unread && (
                    <span
                      className="inline-flex min-w-5 shrink-0 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white"
                      aria-label={`${c.unreadCount} sin leer`}
                    >
                      {c.unreadCount > 99 ? "99+" : c.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
