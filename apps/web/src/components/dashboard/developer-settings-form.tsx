"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2Icon, UploadIcon } from "lucide-react";
import { toast } from "sonner";

import { createUploadUrl } from "@/lib/actions/upload";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { updateDeveloperProfile } from "@/lib/actions/developer-profile";
import type { DeveloperProfileRow } from "@/lib/data/developer-dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function DeveloperSettingsForm({
  developerId,
  profile,
  readOnly = false,
}: {
  developerId: string;
  profile: DeveloperProfileRow;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [name, setName] = React.useState(profile.name);
  const [description, setDescription] = React.useState(profile.description ?? "");
  const [logoUrl, setLogoUrl] = React.useState(profile.logoUrl ?? "");
  const [coverImageUrl, setCoverImageUrl] = React.useState(profile.coverImageUrl ?? "");
  const [website, setWebsite] = React.useState(profile.website ?? "");
  const [phone, setPhone] = React.useState(profile.phone ?? "");
  const [whatsapp, setWhatsapp] = React.useState(profile.whatsapp ?? "");
  const [uploadingLogo, setUploadingLogo] = React.useState(false);
  const [uploadingCover, setUploadingCover] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const logoRef = React.useRef<HTMLInputElement>(null);
  const coverRef = React.useRef<HTMLInputElement>(null);

  const upload = async (
    file: File,
    setUrl: (url: string) => void,
    setBusy: (busy: boolean) => void,
  ) => {
    setBusy(true);
    try {
      const ticket = await createUploadUrl({
        fileName: file.name || "logo.jpg",
        contentType: file.type || "image/jpeg",
        size: file.size,
        prefix: "org",
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
        toast.error(`No se pudo subir la imagen: ${error.message}`);
        return;
      }
      setUrl(ticket.publicUrl!);
    } catch (err) {
      console.error("[developer-settings upload]", err);
      toast.error("Falló la subida de la imagen.");
    } finally {
      setBusy(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;
    setSaving(true);
    const res = await updateDeveloperProfile(developerId, {
      name,
      description,
      logoUrl,
      coverImageUrl,
      website,
      phone,
      whatsapp,
    });
    setSaving(false);
    if (res.ok) {
      toast.success("Perfil de la desarrolladora actualizado");
      router.refresh();
    } else {
      toast.error(res.message ?? "No se pudo guardar");
    }
  };

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-5">
      {readOnly && (
        <p className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning-foreground">
          Inicia sesión con una cuenta de administrador de la desarrolladora para editar este perfil.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Logo</Label>
          <div className="flex items-center gap-3">
            <div className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
              {logoUrl && <Image src={logoUrl} alt="" fill sizes="56px" className="object-cover" />}
            </div>
            <input
              ref={logoRef}
              type="file"
              accept="image/*"
              className="hidden"
              disabled={readOnly}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void upload(file, setLogoUrl, setUploadingLogo);
                if (logoRef.current) logoRef.current.value = "";
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={readOnly || uploadingLogo}
              onClick={() => logoRef.current?.click()}
            >
              {uploadingLogo ? <Loader2Icon className="size-4 animate-spin" /> : <UploadIcon className="size-4" />}
              Subir
            </Button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Portada</Label>
          <div className="flex items-center gap-3">
            <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
              {coverImageUrl && (
                <Image src={coverImageUrl} alt="" fill sizes="96px" className="object-cover" />
              )}
            </div>
            <input
              ref={coverRef}
              type="file"
              accept="image/*"
              className="hidden"
              disabled={readOnly}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void upload(file, setCoverImageUrl, setUploadingCover);
                if (coverRef.current) coverRef.current.value = "";
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={readOnly || uploadingCover}
              onClick={() => coverRef.current?.click()}
            >
              {uploadingCover ? <Loader2Icon className="size-4 animate-spin" /> : <UploadIcon className="size-4" />}
              Subir
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Nombre de la desarrolladora</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} disabled={readOnly} required />
      </div>

      <div className="space-y-1.5">
        <Label>Descripción</Label>
        <Textarea
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={readOnly}
          placeholder="Cuéntales a los clientes sobre tu desarrolladora…"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Sitio web</Label>
          <Input
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            disabled={readOnly}
            placeholder="https://"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Teléfono</Label>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={readOnly}
            placeholder="809-123-4567"
          />
        </div>
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

      <Button type="submit" disabled={readOnly || saving}>
        {saving && <Loader2Icon className="size-4 animate-spin" />}
        Guardar cambios
      </Button>
    </form>
  );
}
