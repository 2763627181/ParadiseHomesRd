"use client";

import * as React from "react";
import Image from "next/image";
import { GripVerticalIcon, ImagePlusIcon, Loader2Icon, StarIcon, XIcon } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { createUploadUrl } from "@/lib/actions/upload";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useWizardStore, type WizardImage } from "@/features/list-property/wizard-store";

export function ImageUploader() {
  const images = useWizardStore((s) => s.data.images);
  const addImages = useWizardStore((s) => s.addImages);
  const updateImage = useWizardStore((s) => s.updateImage);
  const removeImage = useWizardStore((s) => s.removeImage);
  const reorderImages = useWizardStore((s) => s.reorderImages);
  const setCover = useWizardStore((s) => s.setCover);

  const [dragOver, setDragOver] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const dragIndex = React.useRef<number | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const uploadOne = async (file: File): Promise<WizardImage | null> => {
    const ticket = await createUploadUrl({
      fileName: file.name,
      contentType: file.type,
      size: file.size,
      prefix: "listings",
    });
    if (!ticket.ok || !ticket.token || !ticket.path) {
      toast.error(ticket.message ?? "No se pudo subir la imagen");
      return null;
    }
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return null;
    const { error } = await supabase.storage
      .from(ticket.bucket!)
      .uploadToSignedUrl(ticket.path, ticket.token, file);
    if (error) {
      toast.error("Falló la subida de una imagen");
      return null;
    }
    return {
      id: crypto.randomUUID(),
      url: ticket.publicUrl!,
      storagePath: ticket.path,
      isCover: false,
      alt: "",
    };
  };

  const handleFiles = async (files: FileList | File[]) => {
    const list = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, 40 - images.length);
    if (list.length === 0) return;
    setBusy(true);
    try {
      const results = await Promise.all(list.map(uploadOne));
      const ok = results.filter((r): r is WizardImage => r !== null);
      if (ok.length) addImages(ok);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          void handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
          dragOver ? "border-primary bg-primary/5" : "border-border hover:border-foreground/30",
        )}
      >
        {busy ? (
          <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
        ) : (
          <ImagePlusIcon className="size-6 text-muted-foreground" />
        )}
        <p className="text-sm font-medium">Arrastra tus fotos aquí o haz clic para elegir</p>
        <p className="text-xs text-muted-foreground">
          JPG, PNG o WebP · hasta 15 MB · máximo 40 fotos
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && void handleFiles(e.target.files)}
        />
      </div>

      {images.length > 0 && (
        <>
          <p className="mt-4 mb-2 text-xs text-muted-foreground">
            {images.length} foto{images.length === 1 ? "" : "s"} · arrastra para reordenar · la
            portada es la primera que ven los compradores
          </p>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {images.map((img, index) => (
              <li
                key={img.id}
                draggable
                onDragStart={() => (dragIndex.current = index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragIndex.current !== null && dragIndex.current !== index) {
                    reorderImages(dragIndex.current, index);
                  }
                  dragIndex.current = null;
                }}
                className="group relative aspect-4/3 overflow-hidden rounded-lg border border-border bg-muted"
              >
                <Image src={img.url} alt={img.alt || `Foto ${index + 1}`} fill sizes="200px" className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <span className="absolute left-1.5 top-1.5 rounded bg-black/50 p-1 text-white opacity-0 group-hover:opacity-100">
                  <GripVerticalIcon className="size-3.5" />
                </span>
                <button
                  type="button"
                  onClick={() => removeImage(img.id)}
                  aria-label="Eliminar foto"
                  className="absolute right-1.5 top-1.5 rounded-full bg-black/50 p-1 text-white opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100"
                >
                  <XIcon className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setCover(img.id)}
                  className={cn(
                    "absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[0.65rem] font-medium transition-colors",
                    img.isCover
                      ? "bg-accent text-accent-foreground"
                      : "bg-black/50 text-white opacity-0 group-hover:opacity-100",
                  )}
                >
                  <StarIcon className={cn("size-3", img.isCover && "fill-current")} />
                  {img.isCover ? "Portada" : "Hacer portada"}
                </button>
                <input
                  value={img.alt ?? ""}
                  onChange={(e) => updateImage(img.id, { alt: e.target.value })}
                  placeholder="Descripción (opcional)"
                  className="absolute inset-x-1.5 bottom-8 rounded border-0 bg-black/40 px-1.5 py-0.5 text-[0.65rem] text-white opacity-0 outline-none placeholder:text-white/60 group-hover:opacity-100"
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
