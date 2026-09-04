"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon, UserPlusIcon } from "lucide-react";
import { toast } from "sonner";

import { inviteAgentToAgency } from "@/lib/actions/agency-invite";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function InviteAgentDialog() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");

  const reset = () => {
    setFullName("");
    setEmail("");
    setPhone("");
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) return;

    setPending(true);
    const res = await inviteAgentToAgency({ fullName, email, phone: phone || undefined });
    setPending(false);

    if (res.ok) {
      toast.success(res.message ?? `Invitación enviada a ${email}`, {
        description: "El asesor debe revisar su correo para definir su contraseña.",
      });
      setOpen(false);
      reset();
      router.refresh();
    } else {
      toast.error(res.message ?? "No se pudo enviar la invitación");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (!pending ? setOpen(o) : null)}>
      <DialogTrigger asChild>
        <Button size="sm">
          <UserPlusIcon className="size-4" />
          Invitar asesor
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Invitar asesor</DialogTitle>
            <DialogDescription>
              Le enviaremos un correo de invitación para que cree su contraseña y acceda a su panel de
              asesor.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="invite-agent-name">Nombre completo</Label>
              <Input
                id="invite-agent-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ej. María Pérez"
                required
                disabled={pending}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invite-agent-email">Correo</Label>
              <Input
                id="invite-agent-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="maria@ejemplo.com"
                required
                disabled={pending}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invite-agent-phone">Teléfono (opcional)</Label>
              <Input
                id="invite-agent-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="809 000 0000"
                disabled={pending}
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending || !fullName.trim() || !email.trim()}>
              {pending && <Loader2Icon className="size-4 animate-spin" />}
              Enviar invitación
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
