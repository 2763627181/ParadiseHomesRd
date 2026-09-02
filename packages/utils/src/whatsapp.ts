/**
 * Construcción de enlaces de WhatsApp y mensajes pre-armados por propiedad/proyecto.
 * El mensaje SIEMPRE incluye el código de la propiedad para trazabilidad de leads.
 */

export interface WhatsappLinkOptions {
  /** número en formato internacional sin "+" ni espacios, ej. "18498620269" */
  phone: string;
  message: string;
}

export function buildWhatsappUrl({ phone, message }: WhatsappLinkOptions): string {
  const clean = phone.replace(/\D/g, "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

export function propertyInquiryMessage(input: {
  code: string;
  title?: string | null;
  url?: string | null;
}): string {
  const lines = [
    `Hola, estoy interesado en la propiedad ${input.code} que vi en Paradise Homes RD.`,
  ];
  if (input.title) lines.push(`(${input.title})`);
  if (input.url) lines.push(input.url);
  return lines.join("\n");
}

export function projectInquiryMessage(input: {
  code: string;
  name: string;
  url?: string | null;
}): string {
  const lines = [
    `Hola, quisiera información sobre el proyecto ${input.name} (${input.code}) que vi en Paradise Homes RD.`,
  ];
  if (input.url) lines.push(input.url);
  return lines.join("\n");
}

export function unitInquiryMessage(input: {
  projectName: string;
  unitCode: string;
  url?: string | null;
}): string {
  const lines = [
    `Hola, me interesa la unidad ${input.unitCode} del proyecto ${input.projectName} en Paradise Homes RD.`,
  ];
  if (input.url) lines.push(input.url);
  return lines.join("\n");
}

export function scheduleVisitMessage(input: {
  code: string;
  title?: string | null;
  preferredDate?: string | null;
}): string {
  const lines = [
    `Hola, me gustaría agendar una visita para la propiedad ${input.code} de Paradise Homes RD.`,
  ];
  if (input.title) lines.push(`(${input.title})`);
  if (input.preferredDate) lines.push(`Fecha preferida: ${input.preferredDate}`);
  return lines.join("\n");
}

export function agentContactMessage(input: { agentName: string; context?: string | null }): string {
  const base = `Hola ${input.agentName}, te contacto desde Paradise Homes RD.`;
  return input.context ? `${base} ${input.context}` : base;
}
