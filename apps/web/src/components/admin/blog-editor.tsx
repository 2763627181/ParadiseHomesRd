"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2Icon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { savePost, deletePost } from "@/lib/actions/blog";
import type { BlogPost } from "@/lib/data/blog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Markdown } from "@/components/blog/markdown";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function BlogEditor({ post }: { post: BlogPost | null }) {
  const router = useRouter();
  const [title, setTitle] = React.useState(post?.title ?? "");
  const [slug, setSlug] = React.useState(post?.slug ?? "");
  const [excerpt, setExcerpt] = React.useState(post?.excerpt ?? "");
  const [body, setBody] = React.useState(post?.body ?? "");
  const [coverImageUrl, setCoverImageUrl] = React.useState(post?.coverImageUrl ?? "");
  const [category, setCategory] = React.useState(post?.category ?? "");
  const [tags, setTags] = React.useState((post?.tags ?? []).join(", "));
  const [status, setStatus] = React.useState<BlogPost["status"]>(post?.status ?? "DRAFT");
  const [pending, setPending] = React.useState(false);
  const [preview, setPreview] = React.useState(false);

  const save = async (overrideStatus?: BlogPost["status"]) => {
    setPending(true);
    const res = await savePost({
      id: post?.id,
      title,
      slug: slug || undefined,
      excerpt: excerpt || undefined,
      body,
      coverImageUrl: coverImageUrl || "",
      category: category || undefined,
      tags: tags || undefined,
      status: overrideStatus ?? status,
    });
    setPending(false);
    if (res.ok) {
      toast.success(res.message ?? "Guardado");
      if (!post?.id && res.id) router.replace(`/admin/content/${res.id}`);
      else router.refresh();
      if (overrideStatus) setStatus(overrideStatus);
    } else {
      toast.error(res.message ?? "No se pudo guardar");
    }
  };

  const remove = async () => {
    if (!post?.id || !window.confirm("¿Eliminar este artículo?")) return;
    setPending(true);
    const res = await deletePost(post.id);
    setPending(false);
    if (res.ok) {
      toast.success("Eliminado");
      router.push("/admin/content");
    } else {
      toast.error(res.message ?? "No se pudo eliminar");
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="post-title">Título</Label>
          <Input id="post-title" value={title} onChange={(e) => setTitle(e.target.value)} disabled={pending} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="post-slug">Slug (opcional — se genera del título)</Label>
          <Input id="post-slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="como-comprar-en-punta-cana" disabled={pending} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="post-excerpt">Resumen</Label>
          <Textarea id="post-excerpt" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={2} maxLength={300} disabled={pending} />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="post-body">Contenido (Markdown)</Label>
            <button type="button" onClick={() => setPreview((p) => !p)} className="text-xs text-primary hover:underline">
              {preview ? "Editar" : "Previsualizar"}
            </button>
          </div>
          {preview ? (
            <div className="min-h-[20rem] rounded-lg border border-border p-4">
              <Markdown content={body} />
            </div>
          ) : (
            <Textarea
              id="post-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={20}
              className="font-mono text-sm"
              placeholder={"## Encabezado\n\nUn párrafo. **Negrita**, *cursiva*, [enlace](/properties).\n\n- Punto uno\n- Punto dos"}
              disabled={pending}
            />
          )}
        </div>
      </div>

      <aside className="space-y-4">
        <div className="rounded-xl border border-border/70 bg-card p-4">
          <Label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Estado
          </Label>
          <Select value={status} onValueChange={(v) => setStatus(v as BlogPost["status"])} disabled={pending}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DRAFT">Borrador</SelectItem>
              <SelectItem value="PUBLISHED">Publicado</SelectItem>
              <SelectItem value="ARCHIVED">Archivado</SelectItem>
            </SelectContent>
          </Select>
          <div className="mt-3 flex flex-col gap-2">
            <Button size="sm" onClick={() => save()} disabled={pending || !title}>
              {pending && <Loader2Icon className="size-4 animate-spin" />}
              Guardar
            </Button>
            {status !== "PUBLISHED" && (
              <Button size="sm" variant="outline" onClick={() => save("PUBLISHED")} disabled={pending || !title}>
                Guardar y publicar
              </Button>
            )}
            {post?.status === "PUBLISHED" && (
              <Button asChild size="sm" variant="ghost">
                <Link href={`/blog/${post.slug}`} target="_blank">
                  Ver publicado
                </Link>
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-border/70 bg-card p-4">
          <div className="space-y-1.5">
            <Label htmlFor="post-cover" className="text-xs">Imagen de portada (URL)</Label>
            <Input id="post-cover" value={coverImageUrl} onChange={(e) => setCoverImageUrl(e.target.value)} disabled={pending} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="post-cat" className="text-xs">Categoría</Label>
            <Input id="post-cat" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Guías" disabled={pending} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="post-tags" className="text-xs">Etiquetas (separadas por coma)</Label>
            <Input id="post-tags" value={tags} onChange={(e) => setTags(e.target.value)} disabled={pending} />
          </div>
        </div>

        {post?.id && (
          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={remove} disabled={pending}>
            <Trash2Icon className="size-4" />
            Eliminar artículo
          </Button>
        )}
      </aside>
    </div>
  );
}
