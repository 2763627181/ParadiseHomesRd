"use client";

import * as React from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  ATTRIBUTION_COOKIE,
  ATTRIBUTION_MAX_AGE_DAYS,
  mergeAttribution,
  parseAttribution,
  readAttributionParams,
  serializeAttribution,
} from "@paradise/utils/attribution";

import { analytics, getSessionId, initAnalytics } from "@/lib/analytics";

function readCookie(name: string): string | undefined {
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`))
    ?.split("=")[1];
}

function writeCookie(name: string, value: string, maxAgeDays: number): void {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${
    maxAgeDays * 86400
  }; samesite=lax`;
}

function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  React.useEffect(() => {
    if (!pathname) return;
    const query = searchParams?.toString();
    const path = query ? `${pathname}?${query}` : pathname;
    analytics.setContext({ path });
    analytics.track("page_view", { props: { path }, dedupeKey: `pv:${path}` });
  }, [pathname, searchParams]);

  return null;
}

/** Captura de atribución + tracking de page_view. Monta una sola vez. */
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    initAnalytics(getSessionId(), null);
    try {
      const incoming = readAttributionParams(window.location.href, document.referrer);
      const previous = parseAttribution(
        decodeURIComponent(readCookie(ATTRIBUTION_COOKIE) ?? "") || null,
      );
      const merged = mergeAttribution(previous, incoming);
      writeCookie(ATTRIBUTION_COOKIE, serializeAttribution(merged), ATTRIBUTION_MAX_AGE_DAYS);
    } catch {
      /* noop */
    }
  }, []);

  return (
    <>
      <React.Suspense fallback={null}>
        <PageViewTracker />
      </React.Suspense>
      {children}
    </>
  );
}
