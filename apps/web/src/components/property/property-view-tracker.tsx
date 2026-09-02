"use client";

import * as React from "react";

import { analytics } from "@/lib/analytics";

/** Registra `property_view` una vez por sesión y propiedad. */
export function PropertyViewTracker({
  propertyId,
  slug,
  agentId,
}: {
  propertyId: string;
  slug: string;
  agentId?: string;
}) {
  React.useEffect(() => {
    analytics.track("property_view", {
      propertyId,
      agentId,
      props: { slug },
      dedupeKey: `pv-prop:${propertyId}`,
    });
  }, [propertyId, slug, agentId]);

  return null;
}
