"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

/**
 * Campo numérico con separadores de miles automáticos (formato es-DO: "1,250,000").
 * - Guarda el valor como `number | null` (null = vacío).
 * - Al escribir se ignora todo lo que no sea dígito y se reformatea en vivo.
 * - Sin flechas de spinner, sin problema del "0" que no se puede borrar.
 */
export interface MoneyInputProps
  extends Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "type"> {
  value: number | null;
  onChange: (value: number | null) => void;
  /** máximo de dígitos enteros (por defecto 12) */
  maxDigits?: number;
}

const groupDigits = (digits: string) => digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

export function MoneyInput({ value, onChange, maxDigits = 12, className, ...props }: MoneyInputProps) {
  // Texto que se muestra: derivado del value salvo mientras el usuario edita.
  const [display, setDisplay] = React.useState(value == null ? "" : groupDigits(String(Math.trunc(value))));

  React.useEffect(() => {
    const digitsFromValue = value == null ? "" : String(Math.trunc(value));
    const digitsFromDisplay = display.replace(/\D/g, "");
    if (digitsFromValue !== digitsFromDisplay) {
      setDisplay(digitsFromValue ? groupDigits(digitsFromValue) : "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let digits = e.target.value.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
    if (digits.length > maxDigits) digits = digits.slice(0, maxDigits);
    setDisplay(digits ? groupDigits(digits) : "");
    onChange(digits ? Number(digits) : null);
  };

  return (
    <Input
      {...props}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      value={display}
      onChange={handleChange}
      className={cn("tabular-nums", className)}
    />
  );
}
