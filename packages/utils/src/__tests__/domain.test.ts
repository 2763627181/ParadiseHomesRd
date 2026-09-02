import { describe, expect, it } from "vitest";

import { formatLeadCode, formatPropertyCode, isPropertyCode, parsePropertyCode } from "../codes";
import { buildPropertySlug, extractCodeFromSlug, toSlug } from "../slug";
import { calculateMortgage } from "../mortgage";
import { deriveLeadSource, mergeAttribution, readAttributionParams } from "../attribution";
import { propertyInquiryMessage, buildWhatsappUrl } from "../whatsapp";

describe("codes", () => {
  it("genera código de propiedad", () => {
    expect(formatPropertyCode("APT", 291)).toBe("PH-APT-00291");
    expect(formatLeadCode(123)).toBe("PH-L-000123");
  });
  it("valida y parsea", () => {
    expect(isPropertyCode("PH-APT-00291")).toBe(true);
    expect(isPropertyCode("XX-1")).toBe(false);
    expect(parsePropertyCode("PH-APT-00291")).toEqual({ prefix: "APT", seq: 291 });
  });
});

describe("slug", () => {
  it("slugifica con acentos", () => {
    expect(toSlug("Piantini, Distrito Nacional")).toBe("piantini-distrito-nacional");
  });
  it("construye slug SEO de propiedad", () => {
    const slug = buildPropertySlug({
      propertyTypeLabel: "Apartamento",
      bedrooms: 3,
      sector: "Piantini",
      code: "PH-APT-00291",
    });
    expect(slug).toBe("apartamento-3-habitaciones-piantini-ph-apt-00291");
    expect(extractCodeFromSlug(slug)).toBe("PH-APT-00291");
  });
});

describe("mortgage", () => {
  it("calcula cuota francesa", () => {
    const r = calculateMortgage({
      price: 200000,
      downPayment: 20,
      downPaymentIsPercent: true,
      annualRatePercent: 7.5,
      years: 20,
    });
    expect(r.loanAmount).toBe(160000);
    expect(r.downPaymentAmount).toBe(40000);
    expect(r.monthlyPayment).toBeGreaterThan(1200);
    expect(r.monthlyPayment).toBeLessThan(1400);
    expect(r.numberOfPayments).toBe(240);
  });
  it("tasa 0 => préstamo lineal", () => {
    const r = calculateMortgage({ price: 120000, downPayment: 0, annualRatePercent: 0, years: 10 });
    expect(r.monthlyPayment).toBe(1000);
  });
});

describe("attribution", () => {
  it("lee UTM de la URL", () => {
    const params = readAttributionParams(
      "https://paradisehomesrd.com/property/x?utm_source=instagram&utm_medium=paid",
    );
    expect(params.utmSource).toBe("instagram");
    expect(deriveLeadSource(params)).toBe("instagram");
  });
  it("meta ads desde fbclid + medium", () => {
    expect(deriveLeadSource({ fbclid: "abc", utmMedium: "cpc" })).toBe("meta_ads");
  });
  it("first touch se fija una vez", () => {
    const first = mergeAttribution(null, { utmSource: "google" }, "2026-01-01T00:00:00Z");
    const second = mergeAttribution(first, { utmSource: "instagram" }, "2026-02-01T00:00:00Z");
    expect(second.firstTouch.utmSource).toBe("google");
    expect(second.lastTouch.utmSource).toBe("instagram");
  });
  it("visita sin señal no cambia last touch", () => {
    const first = mergeAttribution(null, { utmSource: "google" }, "2026-01-01T00:00:00Z");
    const second = mergeAttribution(first, {}, "2026-02-01T00:00:00Z");
    expect(second.lastTouch.utmSource).toBe("google");
  });
});

describe("whatsapp", () => {
  it("mensaje incluye el código de la propiedad", () => {
    const msg = propertyInquiryMessage({ code: "PH-APT-00123", title: "Apto en Piantini" });
    expect(msg).toContain("PH-APT-00123");
    expect(msg).toContain("Paradise Homes RD");
  });
  it("construye url wa.me", () => {
    const url = buildWhatsappUrl({ phone: "1 (849) 862-0269", message: "Hola" });
    expect(url).toBe("https://wa.me/18498620269?text=Hola");
  });
});
