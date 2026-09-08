"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { HandshakeIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "@paradise/utils/currency";

import { registerClosing } from "@/lib/actions/closings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const today = () => new Date().toISOString().slice(0, 10);

export function RegisterClosingButton({
  leadId,
  defaultCurrency = "USD",
  size = "sm",
  className,
}: {
  leadId: string;
  defaultCurrency?: "USD" | "DOP";
  size?: React.ComponentProps<typeof Button>["size"];
  className?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [amount, setAmount] = React.useState<number | null>(null);
  const [currency, setCurrency] = React.useState<"USD" | "DOP">(defaultCurrency);
  const [closedAt, setClosedAt] = React.useState(today());
  const [percent, setPercent] = React.useState("5");
  const [partnerName, setPartnerName] = React.useState("");
  const [notes, setNotes] = React.useState("");

  const amountNum = amount ?? 0;
  const percentNum = Number(percent) || 0;
  const commissionPreview = Math.round((amountNum * percentNum) / 100 * 100) / 100;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amountNum <= 0) {
      toast.error("Ingresa el monto del cierre.");
      return;
    }
    setPending(true);
    const res = await registerClosing({
      leadId,
      closingAmount: amountNum,
      currency,
      closedAt,
      commissionPercent: percentNum,
      partnerName: partnerName || undefined,
      notes: notes || undefined,
    });
    setPending(false);
    if (res.ok) {
      toast.success(res.message ?? "Cierre registrado");
      setOpen(false);
      router.refresh();
    } else {
      toast.error(res.message ?? "No se pudo registrar el cierre");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (!pending ? setOpen(o) : null)}>
      <DialogTrigger asChild>
        <Button type="button" size={size} className={className}>
          <HandshakeIcon className="size-4" />
          Registrar cierre
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Registrar cierre</DialogTitle>
            <DialogDescription>
              Deja constancia de la venta o alquiler cerrado. La comisión de Paradise se registra como
              pendiente; el equipo la liquida por fuera.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-[1fr_7rem] gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="closing-amount">Monto del cierre</Label>
                <MoneyInput
                  id="closing-amount"
                  value={amount}
                  onChange={setAmount}
                  placeholder="0"
                  required
                  disabled={pending}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Moneda</Label>
                <Select value={currency} onValueChange={(v) => setCurrency(v as "USD" | "DOP")}>
                  <SelectTrigger disabled={pending}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="DOP">DOP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="closing-date">Fecha del cierre</Label>
                <Input
                  id="closing-date"
                  type="date"
                  value={closedAt}
                  onChange={(e) => setClosedAt(e.target.value)}
                  disabled={pending}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="closing-percent">Comisión (%)</Label>
                <Input
                  id="closing-percent"
                  inputMode="decimal"
                  value={percent}
                  onChange={(e) => setPercent(e.target.value)}
                  disabled={pending}
                />
              </div>
            </div>

            {commissionPreview > 0 && (
              <p className="rounded-lg bg-secondary px-3 py-2 text-sm text-muted-foreground">
                Comisión estimada: <strong className="text-foreground">{formatPrice(commissionPreview, currency)}</strong>
              </p>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="closing-partner">Contraparte (opcional)</Label>
              <Input
                id="closing-partner"
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
                placeholder="Nombre del comprador / inquilino"
                disabled={pending}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="closing-notes">Notas (opcional)</Label>
              <Textarea
                id="closing-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={pending}
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2Icon className="size-4 animate-spin" />}
              Registrar cierre
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
