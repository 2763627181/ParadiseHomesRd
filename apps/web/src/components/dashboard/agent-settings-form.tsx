"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { updateAgentSettings } from "@/lib/actions/agent-profile";
import type { AgentProfileRow } from "@/lib/data/agent-dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AgentSettingsForm({
  profile,
  readOnly = false,
}: {
  profile: AgentProfileRow;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [languages, setLanguages] = React.useState(profile.languages.join(", "));
  const [areas, setAreas] = React.useState(profile.areas.join(", "));
  const [saving, setSaving] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;
    setSaving(true);
    const res = await updateAgentSettings({
      languages: languages.split(",").map((s) => s.trim()).filter(Boolean),
      areas: areas.split(",").map((s) => s.trim()).filter(Boolean),
    });
    setSaving(false);
    if (res.ok) {
      toast.success("Preferencias actualizadas");
      router.refresh();
    } else {
      toast.error(res.message ?? "No se pudo guardar");
    }
  };

  return (
    <form onSubmit={submit} className="max-w-xl space-y-5 rounded-xl border border-border/70 bg-card p-5">
      {readOnly && (
        <p className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning-foreground">
          Inicia sesión con una cuenta de asesor para editar tus ajustes.
        </p>
      )}

      <div className="space-y-1.5">
        <Label>Idiomas</Label>
        <Input
          value={languages}
          onChange={(e) => setLanguages(e.target.value)}
          disabled={readOnly}
          placeholder="Español, English"
        />
        <p className="text-xs text-muted-foreground">Sepáralos con comas. Se muestran en tu perfil público.</p>
      </div>

      <div className="space-y-1.5">
        <Label>Zonas donde trabajas</Label>
        <Input
          value={areas}
          onChange={(e) => setAreas(e.target.value)}
          disabled={readOnly}
          placeholder="Piantini, Punta Cana, Santiago…"
        />
        <p className="text-xs text-muted-foreground">Sepáralas con comas.</p>
      </div>

      <Button type="submit" disabled={readOnly || saving}>
        {saving && <Loader2Icon className="size-4 animate-spin" />}
        Guardar cambios
      </Button>
    </form>
  );
}
