/**
 * Códigos legibles de Paradise Homes RD.
 *   Propiedad: PH-APT-00291
 *   Lead:      PH-L-000123
 *   Proyecto:  PH-PRJ-00042
 *   Visita:    PH-V-000777
 *   Cierre:    PH-C-000012
 */

const PAD = (n: number, width: number) => String(n).padStart(width, "0");

export function formatPropertyCode(typePrefix: string, seq: number): string {
  return `PH-${typePrefix.toUpperCase()}-${PAD(seq, 5)}`;
}

export function formatLeadCode(seq: number): string {
  return `PH-L-${PAD(seq, 6)}`;
}

export function formatProjectCode(seq: number): string {
  return `PH-PRJ-${PAD(seq, 5)}`;
}

export function formatUnitCode(projectSeq: number, unitLabel: string): string {
  return `PH-PRJ-${PAD(projectSeq, 5)}-${unitLabel.toUpperCase()}`;
}

export function formatVisitCode(seq: number): string {
  return `PH-V-${PAD(seq, 6)}`;
}

export function formatClosingCode(seq: number): string {
  return `PH-C-${PAD(seq, 6)}`;
}

export function formatCommissionCode(seq: number): string {
  return `PH-CM-${PAD(seq, 6)}`;
}

const PROPERTY_CODE_RE = /^PH-([A-Z]{3})-(\d{3,})$/;
const LEAD_CODE_RE = /^PH-L-(\d{3,})$/;

export function parsePropertyCode(code: string): { prefix: string; seq: number } | null {
  const m = code.trim().toUpperCase().match(PROPERTY_CODE_RE);
  if (!m) return null;
  return { prefix: m[1]!, seq: Number(m[2]) };
}

export function isPropertyCode(value: string): boolean {
  return PROPERTY_CODE_RE.test(value.trim().toUpperCase());
}

export function isLeadCode(value: string): boolean {
  return LEAD_CODE_RE.test(value.trim().toUpperCase());
}
