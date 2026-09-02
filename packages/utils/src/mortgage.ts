/**
 * Calculadora hipotecaria — SOLO informativa.
 * Amortización francesa (cuota fija). No representa una oferta de financiamiento.
 */

export interface MortgageInput {
  /** precio de la propiedad */
  price: number;
  /** monto o porcentaje de inicial */
  downPayment: number;
  /** true si downPayment es porcentaje (0–100) */
  downPaymentIsPercent?: boolean;
  /** tasa de interés anual nominal, en porcentaje (ej. 9.5) */
  annualRatePercent: number;
  /** plazo en años */
  years: number;
}

export interface MortgageResult {
  loanAmount: number;
  downPaymentAmount: number;
  monthlyPayment: number;
  totalPaid: number;
  totalInterest: number;
  numberOfPayments: number;
  disclaimer: string;
}

export const MORTGAGE_DISCLAIMER =
  "Este cálculo es únicamente informativo y no constituye una oferta de crédito. Las condiciones reales dependen de cada entidad financiera.";

export function calculateMortgage(input: MortgageInput): MortgageResult {
  const price = Math.max(0, input.price);
  const downPaymentAmount = input.downPaymentIsPercent
    ? (price * clamp(input.downPayment, 0, 100)) / 100
    : Math.min(input.downPayment, price);

  const loanAmount = Math.max(0, price - downPaymentAmount);
  const n = Math.round(clamp(input.years, 1, 40) * 12);
  const monthlyRate = clamp(input.annualRatePercent, 0, 100) / 100 / 12;

  let monthlyPayment: number;
  if (monthlyRate === 0) {
    monthlyPayment = loanAmount / n;
  } else {
    const factor = Math.pow(1 + monthlyRate, n);
    monthlyPayment = (loanAmount * monthlyRate * factor) / (factor - 1);
  }

  const totalPaid = monthlyPayment * n + downPaymentAmount;
  const totalInterest = monthlyPayment * n - loanAmount;

  return {
    loanAmount: round2(loanAmount),
    downPaymentAmount: round2(downPaymentAmount),
    monthlyPayment: round2(monthlyPayment),
    totalPaid: round2(totalPaid),
    totalInterest: round2(Math.max(0, totalInterest)),
    numberOfPayments: n,
    disclaimer: MORTGAGE_DISCLAIMER,
  };
}

/** Genera la tabla de amortización mes a mes (para gráfico/desglose). */
export function amortizationSchedule(input: MortgageInput): Array<{
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}> {
  const { loanAmount, monthlyPayment, numberOfPayments } = calculateMortgage(input);
  const monthlyRate = clamp(input.annualRatePercent, 0, 100) / 100 / 12;
  const rows = [];
  let balance = loanAmount;

  for (let month = 1; month <= numberOfPayments; month++) {
    const interest = round2(balance * monthlyRate);
    const principal = round2(monthlyPayment - interest);
    balance = round2(Math.max(0, balance - principal));
    rows.push({ month, payment: monthlyPayment, principal, interest, balance });
  }
  return rows;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
