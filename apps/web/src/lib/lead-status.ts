import { LEAD_STATUS, type LeadStatus } from "@paradise/config";

export { LEAD_STATUS };

export const STATUS_LABELS_ES: Record<LeadStatus, string> = {
  NEW: "Nuevo",
  CONTACTED: "Contactado",
  QUALIFIED: "Calificado",
  VISIT_SCHEDULED: "Visita agendada",
  VISIT_COMPLETED: "Visita realizada",
  NEGOTIATING: "Negociando",
  RESERVED: "Reservado",
  CLOSED_WON: "Cerrado (ganado)",
  CLOSED_LOST: "Cerrado (perdido)",
};
