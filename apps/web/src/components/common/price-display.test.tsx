import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PriceDisplay } from "@/components/common/price-display";

describe("PriceDisplay", () => {
  it("muestra el precio formateado", () => {
    render(<PriceDisplay price={{ amount: 185000, currency: "USD" }} />);
    expect(screen.getByText(/US\$185,000/)).toBeInTheDocument();
  });

  it("muestra el periodo /mes para alquiler", () => {
    render(<PriceDisplay price={{ amount: 1850, currency: "USD", period: "month" }} />);
    expect(screen.getByText("/mes")).toBeInTheDocument();
  });

  it("cae a 'Precio a consultar'", () => {
    render(<PriceDisplay price={{ amount: null, currency: "USD", onRequest: true }} />);
    expect(screen.getByText("Precio a consultar")).toBeInTheDocument();
  });
});
