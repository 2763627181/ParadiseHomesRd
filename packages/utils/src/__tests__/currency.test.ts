import { describe, expect, it } from "vitest";

import { formatCompactNumber, formatPrice, formatPriceRange, pricePerM2 } from "../currency";

describe("formatPrice", () => {
  it("formatea USD sin decimales", () => {
    expect(formatPrice(185000, "USD")).toBe("US$185,000");
  });
  it("formatea DOP", () => {
    expect(formatPrice(9800000, "DOP")).toBe("RD$9,800,000");
  });
  it("modo compacto", () => {
    expect(formatPrice(185000, "USD", { compact: true })).toBe("US$185K");
    expect(formatPrice(1250000, "USD", { compact: true })).toBe("US$1.3M");
    expect(formatPrice(2000000, "USD", { compact: true })).toBe("US$2M");
  });
  it("sufijo de alquiler", () => {
    expect(formatPrice(1850, "USD", { suffix: "/mes" })).toBe("US$1,850/mes");
  });
  it("fallback cuando no hay monto", () => {
    expect(formatPrice(null, "USD")).toBe("Precio a consultar");
  });
});

describe("formatCompactNumber", () => {
  it("millones y miles", () => {
    expect(formatCompactNumber(2_400_000)).toBe("2.4M");
    expect(formatCompactNumber(185_000)).toBe("185K");
    expect(formatCompactNumber(950)).toBe("950");
  });
});

describe("formatPriceRange", () => {
  it("rango completo", () => {
    expect(formatPriceRange(129000, 320000, "USD")).toBe("US$129K – US$320K");
  });
  it("solo mínimo", () => {
    expect(formatPriceRange(129000, null, "USD")).toBe("Desde US$129K");
  });
});

describe("pricePerM2", () => {
  it("calcula precio por metro", () => {
    expect(pricePerM2(285000, 175)).toBe(1629);
  });
  it("devuelve null si falta dato", () => {
    expect(pricePerM2(285000, 0)).toBeNull();
  });
});
