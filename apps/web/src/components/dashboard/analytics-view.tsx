import Link from "next/link";
import { formatPrice } from "@paradise/utils/currency";

import type { AnalyticsSummary } from "@/lib/data/analytics";
import { StatGrid } from "@/components/dashboard/stat-card";
import { FunnelChart } from "@/components/dashboard/funnel-chart";
import { ActivityChart } from "@/components/dashboard/activity-chart";

function pct(n: number, d: number): string {
  return d > 0 ? `${((n / d) * 100).toFixed(1)}%` : "—";
}

export function AnalyticsView({
  data,
  showAgents = false,
  showTraffic = false,
}: {
  data: AnalyticsSummary;
  showAgents?: boolean;
  showTraffic?: boolean;
}) {
  const t = data.totals;

  return (
    <div className="space-y-6">
      <StatGrid
        stats={[
          { key: "views", label: "Vistas de propiedad", value: t.views },
          { key: "leads", label: "Leads", value: t.leads },
          { key: "qualified", label: "Calificados", value: t.qualified, hint: pct(t.qualified, t.leads) },
          { key: "closings", label: "Cierres", value: t.closings, hint: pct(t.closings, t.leads) },
          {
            key: "vol",
            label: "Volumen cerrado",
            value: formatPrice(t.volumeUsd, "USD", { compact: true }),
          },
        ]}
      />

      <section className="rounded-xl border border-border/70 bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold">Actividad por día</h2>
        <ActivityChart data={data.activity} />
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <section className="rounded-xl border border-border/70 bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold">Embudo de conversión</h2>
          <FunnelChart stages={data.funnel} />
        </section>

        <section className="rounded-xl border border-border/70 bg-card p-5">
          <h2 className="mb-3 text-sm font-semibold">Leads por fuente</h2>
          {data.sources.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Sin leads en el período.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="py-2 text-left font-medium">Fuente</th>
                  <th className="py-2 text-right font-medium">Leads</th>
                  <th className="py-2 text-right font-medium">Cierres</th>
                  <th className="py-2 text-right font-medium">Conv.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {data.sources.map((s) => (
                  <tr key={s.source}>
                    <td className="py-2">{s.label}</td>
                    <td className="py-2 text-right tabular-nums">{s.leads}</td>
                    <td className="py-2 text-right tabular-nums">{s.closings}</td>
                    <td className="py-2 text-right tabular-nums text-muted-foreground">{pct(s.closings, s.leads)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-border/70 bg-card p-5">
          <h2 className="mb-3 text-sm font-semibold">Propiedades con mejor rendimiento</h2>
          {data.topProperties.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Sin datos todavía.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {data.topProperties.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3">
                  <Link href={`/property/${p.slug}`} className="truncate hover:underline">
                    {p.title}
                  </Link>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {p.views} vistas · {p.leads} leads
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {showAgents && (
          <section className="rounded-xl border border-border/70 bg-card p-5">
            <h2 className="mb-3 text-sm font-semibold">Ranking de asesores</h2>
            {data.topAgents.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Sin datos todavía.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {data.topAgents.map((a, i) => (
                  <li key={a.id} className="flex items-center justify-between gap-3">
                    <Link href={`/agent/${a.slug}`} className="truncate hover:underline">
                      {i + 1}. {a.name}
                    </Link>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {a.leads} leads · {a.closings} cierres
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {showTraffic && (
          <section className="rounded-xl border border-border/70 bg-card p-5">
            <h2 className="mb-3 text-sm font-semibold">Canales de tráfico</h2>
            {data.traffic.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Sin datos todavía.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {data.traffic.map((tr) => (
                  <li key={tr.source} className="flex items-center justify-between gap-3">
                    <span className="truncate">{tr.source}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{tr.events.toLocaleString("es-DO")}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
