import { describe, expect, it } from "vitest";

import { leadFormSchema } from "../lead";
import { phoneDoSchema } from "../primitives";
import { propertySearchParamsSchema } from "../search";

describe("phoneDoSchema", () => {
  it("acepta y normaliza formatos dominicanos", () => {
    expect(phoneDoSchema.parse("809-123-4567")).toBe("8091234567");
    expect(phoneDoSchema.parse("+1 (849) 862 0269")).toBe("8498620269");
  });
  it("rechaza números no dominicanos", () => {
    expect(phoneDoSchema.safeParse("212-555-0100").success).toBe(false);
  });
});

describe("leadFormSchema", () => {
  it("requiere consentimiento", () => {
    const result = leadFormSchema.safeParse({
      fullName: "Ana Gómez",
      phone: "8091234567",
      consent: false,
    });
    expect(result.success).toBe(false);
  });
  it("valida un lead completo", () => {
    const result = leadFormSchema.safeParse({
      fullName: "Ana Gómez",
      phone: "809-123-4567",
      email: "ana@correo.com",
      consent: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.channel).toBe("property_form");
      expect(result.data.intent).toBe("info");
    }
  });
});

describe("propertySearchParamsSchema", () => {
  it("parsea listas separadas por comas de forma tolerante", () => {
    const parsed = propertySearchParamsSchema.parse({
      propertyTypes: "APARTMENT,VILLA,INVALIDO",
      locations: "piantini,punta-cana",
      minPrice: "150000",
      sort: "no-existe",
    });
    expect(parsed.propertyTypes).toEqual(["APARTMENT", "VILLA"]);
    expect(parsed.locations).toEqual(["piantini", "punta-cana"]);
    expect(parsed.minPrice).toBe(150000);
    expect(parsed.sort).toBe("relevance");
  });
});
