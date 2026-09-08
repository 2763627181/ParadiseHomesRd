import type { Metadata } from "next";
import Link from "next/link";
import { PROPERTY_TYPE_LABELS_PLURAL } from "@paradise/config";
import { formatPrice } from "@paradise/utils/currency";

import { getMarketInsights } from "@/lib/data/market";
import { Container } from "@/components/layout/container";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = {
  title: "Insights del mercado inmobiliario dominicano",
  description:
    "Precio promedio, precio por m² y volumen de inventario por ciudad en República Dominicana, calculado con las propiedades publicadas en Paradise Homes RD.",
  alternates: { canonical: "/market" },
};

export const revalidate = 3600;

function money(n: number | null): string {
  return n == null ? "—" : formatPrice(n, "USD", { compact: true });
}

export default async function MarketPage() {
  const data = await getMarketInsights();

  if (!data || data.totalListings < 20) {
    return (
      <ComingSoon
        title="Insights del mercado"
        description="Aún no hay suficiente inventario publicado para calcular promedios confiables. Volveremos con datos reales — nunca estimaciones — en cuanto haya más propiedades."
        phase="pronto"
      />
    );
  }

  return (
    <Container className="py-10 lg:py-14">
      <header className="mb-8 max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Insights del mercado</h1>
        <p className="mt-2 text-muted-foreground">
          Calculado con <strong>{data.totalListings.toLocaleString("es-DO")}</strong> propiedades publicadas
          en Paradise Homes RD en {data.totalCities} ciudades. Todo son <strong>datos reales</strong> de la
          plataforma — no estimaciones. Mostramos una zona solo si tiene al menos 3 publicaciones.
        </p>
        {data.overallPricePerM2Usd != null && (
          <p className="mt-4 rounded-lg border border-border/70 bg-card px-4 py-3 text-sm">
            Precio mediano por m² (venta):{" "}
            <strong className="text-base">{money(data.overallPricePerM2Usd)}/m²</strong>
          </p>
        )}
      </header>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold">Por ciudad</h2>
        <div className="overflow-x-auto rounded-xl border border-border/70">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-secondary/60 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium">Ciudad</th>
                <th className="px-4 py-2.5 text-right font-medium">Publicaciones</th>
                <th className="px-4 py-2.5 text-right font-medium">Precio venta (mediana)</th>
                <th className="px-4 py-2.5 text-right font-medium">Precio/m²</th>
                <th className="px-4 py-2.5 text-right font-medium">Alquiler (mediana)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {data.cities.map((c) => (
                <tr key={c.city} className="hover:bg-secondary/30">
                  <td className="px-4 py-3">
                    <span className="font-medium">{c.city}</span>
                    {c.province && <span className="block text-xs text-muted-foreground">{c.province}</span>}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{c.listings}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{money(c.medianSaleUsd)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {c.pricePerM2Usd != null ? `${money(c.pricePerM2Usd)}/m²` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {c.medianRentUsd != null ? `${money(c.medianRentUsd)}/mes` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Por tipo de propiedad (venta)</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.byType.map((t) => (
            <div key={t.type} className="rounded-xl border border-border/70 bg-card p-4">
              <p className="text-sm font-medium">
                {PROPERTY_TYPE_LABELS_PLURAL[t.type as keyof typeof PROPERTY_TYPE_LABELS_PLURAL] ?? t.type}
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{money(t.medianUsd)}</p>
              <p className="text-xs text-muted-foreground">
                {t.count} publicacion{t.count === 1 ? "" : "es"} · precio mediano
              </p>
            </div>
          ))}
        </div>
      </section>

      <p className="mt-10 text-sm text-muted-foreground">
        ¿Buscas algo específico?{" "}
        <Link href="/properties" className="font-medium text-primary hover:underline">
          Explora todas las propiedades
        </Link>
        .
      </p>
    </Container>
  );
}
