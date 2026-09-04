"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon, UploadIcon } from "lucide-react";
import { toast } from "sonner";
import { initials } from "@paradise/utils/format";

import { createUploadUrl } from "@/lib/actions/upload";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { updateAgentProfile } from "@/lib/actions/agent-profile";
import type { AgentProfileRow } from "@/lib/data/agent-dashboard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function AgentProfileForm({
  profile,
  readOnly = false,
}: {
  profile: AgentProfileRow;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [fullName, setFullName] = React.useState(profile.fullName);
  const [title, setTitle] = React.useState(profile.title ?? "");
  const [bio, setBio] = React.useState(profile.bio ?? "");
  const [phone, setPhone] = React.useState(profile.phone ?? "");
  const [whatsapp, setWhatsapp] = React.useState(profile.whatsapp ?? "");
  const [avatarUrl, setAvatarUrl] = React.useState(profile.avatarUrl ?? "");
  const [uploading, setUploading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const uploadAvatar = async (file: File) => {
    setUploading(true);
    try {
      const ticket = await createUploadUrl({
        fileName: file.name || "avatar.jpg",
        contentType: file.type || "image/jpeg",
        size: file.size,
        prefix: "avatars",
      });
      if (!ticket.ok || !ticket.token || !ticket.path) {
        toast.error(ticket.message ?? "No se pudo preparar la subida.");
        return;
      }
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        toast.error("El almacenamiento no está disponible.");
        return;
      }
      const { error } = await supabase.storage
        .from(ticket.bucket!)
        .uploadToSignedUrl(ticket.path, ticket.token, file, {
          contentType: file.type || "image/jpeg",
        });
      if (error) {
        toast.error(`No se pudo subir la foto: ${error.message}`);
        return;
      }
      setAvatarUrl(ticket.publicUrl!);
    } catch (err) {
      console.error("[uploadAvatar]", err);
      toast.error("Falló la subida de la foto.");
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;
    setSaving(true);
    const res = await updateAgentProfile({ fullName, title, bio, phone, whatsapp, avatarUrl });
    setSaving(false);
    if (res.ok) {
      toast.success("Perfil actualizado");
      router.refresh();
    } else {
      toast.error(res.message ?? "No se pudo guardar el perfil");
    }
  };

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-5">
      {readOnly && (
        <p className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning-foreground">
          Inicia sesión con una cuenta de asesor para editar tu perfil.
        </p>
      )}

      <div className="flex items-center gap-4">
        <Avatar className="size-16">
          {avatarUrl && <AvatarImage src={avatarUrl} alt={fullName} />}
          <AvatarFallback>{initials(fullName || "?")}</AvatarFallback>
        </Avatar>
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            disabled={readOnly}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void uploadAvatar(file);
              if (fileRef.current) fileRef.current.value = "";
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={readOnly || uploading}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? <Loader2Icon className="size-4 animate-spin" /> : <UploadIcon className="size-4" />}
            Cambiar foto
          </Button>
          <p className="mt-1.5 text-xs text-muted-foreground">JPG, PNG o WebP · máx. 25 MB</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Nombre completo</Label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={readOnly} required />
        </div>
        <div className="space-y-1.5">
          <Label>Título</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={readOnly}
            placeholder="Asesor inmobiliario"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Biografía</Label>
        <Textarea
          rows={4}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          disabled={readOnly}
          placeholder="Cuéntales a tus clientes sobre tu experiencia y especialidad…"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Teléfono</Label>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={readOnly}
            placeholder="809-123-4567"
          />
        </div>
        <div className="space-y-1.5">
          <Label>WhatsApp</Label>
          <Input
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            disabled={readOnly}
            placeholder="1809-123-4567"
          />
        </div>
      </div>

      <Button type="submit" disabled={readOnly || saving}>
        {saving && <Loader2Icon className="size-4 animate-spin" />}
        Guardar cambios
      </Button>
    </form>
  );
}
