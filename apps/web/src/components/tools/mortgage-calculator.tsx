"use client";

import * as React from "react";
import { calculateMortgage, MORTGAGE_DISCLAIMER } from "@paradise/utils/mortgage";
import { formatPrice, type CurrencyCode } from "@paradise/utils/currency";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

export function MortgageCalculator({
  defaultPrice = 200000,
  currency = "USD",
  className,
}: {
  defaultPrice?: number;
  currency?: CurrencyCode;
  className?: string;
}) {
  const [price, setPrice] = React.useState(defaultPrice);
  const [downPct, setDownPct] = React.useState(20);
  const [rate, setRate] = React.useState(currency === "USD" ? 7.5 : 11.5);
  const [years, setYears] = React.useState(20);

  const result = React.useMemo(
    () =>
      calculateMortgage({
        price,
        downPayment: downPct,
        downPaymentIsPercent: true,
        annualRatePercent: rate,
        years,
      }),
    [price, downPct, rate, years],
  );

  return (
    <div className={cn("grid gap-6 lg:grid-cols-[1fr_20rem]", className)}>
      <div className="space-y-6 rounded-2xl border border-border/70 bg-card p-6">
        <div className="space-y-2">
          <Label htmlFor="mc-price">Precio de la propiedad</Label>
          <Input
            id="mc-price"
            type="number"
            value={price}
            onChange={(e) => setPrice(Math.max(0, Number(e.target.value)))}
          />
        </div>

        <SliderField
          label="Inicial"
          value={downPct}
          suffix={`% · ${formatPrice(result.downPaymentAmount, currency, { compact: true })}`}
          min={0}
          max={70}
          step={1}
          onChange={setDownPct}
        />
        <SliderField
          label="Tasa de interés anual"
          value={rate}
          suffix="%"
          min={4}
          max={18}
          step={0.25}
          onChange={setRate}
        />
        <SliderField
          label="Plazo"
          value={years}
          suffix=" años"
          min={5}
          max={30}
          step={1}
          onChange={setYears}
        />
      </div>

      <div className="flex flex-col rounded-2xl border border-border/70 bg-primary p-6 text-primary-foreground">
        <p className="text-sm text-primary-foreground/70">Cuota mensual estimada</p>
        <p className="mt-1 text-3xl font-semibold tabular-nums">
          {formatPrice(result.monthlyPayment, currency)}
        </p>
        <dl className="mt-6 space-y-2 text-sm">
          <Row label="Monto a financiar" value={formatPrice(result.loanAmount, currency, { compact: true })} />
          <Row label="Total de intereses" value={formatPrice(result.totalInterest, currency, { compact: true })} />
          <Row label="Total a pagar" value={formatPrice(result.totalPaid, currency, { compact: true })} />
          <Row label="Número de cuotas" value={String(result.numberOfPayments)} />
        </dl>
        <p className="mt-6 text-[0.7rem] leading-relaxed text-primary-foreground/60">
          {MORTGAGE_DISCLAIMER}
        </p>
      </div>
    </div>
  );
}

function SliderField({
  label,
  value,
  suffix,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  suffix: string;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-baseline justify-between">
        <Label>{label}</Label>
        <span className="text-sm font-medium tabular-nums">
          {value}
          {suffix}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v ?? min)}
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-primary-foreground/10 pb-2">
      <dt className="text-primary-foreground/70">{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </div>
  );
}
