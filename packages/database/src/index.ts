export type {
  Database,
  Json,
  Tables,
  TablesInsert,
  Views,
} from "./database.types.js";

export {
  demoAgencies,
  demoAgents,
  demoDevelopers,
  demoProjects,
  demoProperties,
  demoPropertySummaries,
  DEMO_SUMMARY,
} from "./seed-data.js";

export const MIGRATIONS_DIR = "migrations";
