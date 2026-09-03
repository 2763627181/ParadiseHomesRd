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
  const [uploadingCount, setUploadingCount] = React.useState(0);
  const dragIndex = React.useRef<number | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const uploadOne = async (file: File): Promise<WizardImage | null> => {
    try {
      const ticket = await createUploadUrl({
        fileName: file.name || "foto.jpg",
        contentType: file.type || "image/jpeg",
        size: file.size,
        prefix: "listings",
      });
      if (!ticket.ok || !ticket.token || !ticket.path) {
        toast.error(ticket.message ?? "No se pudo preparar la subida");
        return null;
      }
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        toast.error("El almacenamiento no está disponible.");
        return null;
      }
      const { error } = await supabase.storage
        .from(ticket.bucket!)
        .uploadToSignedUrl(ticket.path, ticket.token, file, {
          contentType: file.type || "image/jpeg",
        });
      if (error) {
        console.error("[uploadToSignedUrl]", error);
        toast.error(`No se pudo subir «${file.name}»: ${error.message}`);
        return null;
      }
      return {
        id: crypto.randomUUID(),
        url: ticket.publicUrl!,
        storagePath: ticket.path,
        isCover: false,
        alt: "",
      };
    } catch (err) {
      console.error("[uploadOne]", err);
      toast.error("Falló la subida de una imagen");
      return null;
    }
  };

  const handleFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList)
      .filter((f) => f.type.startsWith("image/") || /\.(jpe?g|png|webp|avif|gif|heic|heif)$/i.test(f.name))
      .slice(0, 40 - images.length);
    if (files.length === 0) {
      toast.error("Selecciona archivos de imagen.");
      return;
    }
    setUploadingCount((n) => n + files.length);
    for (const file of files) {
      const result = await uploadOne(file);
      if (result) addImages([result]);
      setUploadingCount((n) => Math.max(0, n - 1));
    }
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-label="Subir fotos"
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
          if (e.dataTransfer.files?.length) void handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
          dragOver ? "border-primary bg-primary/5" : "border-border hover:border-foreground/30",
        )}
      >
        {uploadingCount > 0 ? (
          <>
            <Loader2Icon className="size-6 animate-spin text-primary" />
            <p className="text-sm font-medium">Subiendo {uploadingCount} foto{uploadingCount === 1 ? "" : "s"}…</p>
          </>
        ) : (
          <>
            <ImagePlusIcon className="size-6 text-muted-foreground" />
            <p className="text-sm font-medium">Arrastra tus fotos aquí o haz clic para elegir</p>
            <p className="text-xs text-muted-foreground">
              JPG, PNG, WebP o HEIC · hasta 25 MB · máximo 40 fotos
            </p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*,.heic,.heif"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) void handleFiles(e.target.files);
          }}
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
                <Image
                  src={img.url}
                  alt={img.alt || `Foto ${index + 1}`}
                  fill
                  sizes="200px"
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <span className="absolute left-1.5 top-1.5 rounded bg-black/50 p-1 text-white opacity-0 group-hover:opacity-100">
                  <GripVerticalIcon className="size-3.5" />
                </span>
                <button
                  type="button"
                  onClick={() => removeImage(img.id)}
                  aria-label="Eliminar foto"
                  className="absolute right-1.5 top-1.5 rounded-full bg-black/55 p-1 text-white transition-opacity hover:bg-black/75 sm:opacity-0 sm:group-hover:opacity-100"
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
                      : "bg-black/55 text-white sm:opacity-0 sm:group-hover:opacity-100",
                  )}
                >
                  <StarIcon className={cn("size-3", img.isCover && "fill-current")} />
                  {img.isCover ? "Portada" : "Portada"}
                </button>
                <input
                  value={img.alt ?? ""}
                  onChange={(e) => updateImage(img.id, { alt: e.target.value })}
                  placeholder="Descripción (opcional)"
                  className="absolute inset-x-1.5 bottom-8 rounded border-0 bg-black/45 px-1.5 py-0.5 text-[0.65rem] text-white outline-none placeholder:text-white/60 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
