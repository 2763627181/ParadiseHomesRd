import "server-only";

import { cache } from "react";
import type { Location } from "@paradise/types";

import {
  demoFeaturedLocations,
  demoLocationBySlug,
  demoLocationChildren,
} from "./demo-store";

export const getFeaturedLocations = cache(async (): Promise<Location[]> =>
  demoFeaturedLocations(),
);
export const getLocationBySlug = cache(async (slug: string): Promise<Location | null> =>
  demoLocationBySlug(slug),
);
export const getLocationChildren = cache(async (slug: string): Promise<Location[]> =>
  demoLocationChildren(slug),
);
