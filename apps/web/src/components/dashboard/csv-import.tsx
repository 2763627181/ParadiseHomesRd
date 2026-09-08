"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2Icon, DownloadIcon, Loader2Icon, UploadIcon, XCircleIcon } from "lucide-react";
import { toast } from "sonner";

import { csvToObjects } from "@/lib/csv";
import { importProperties, IMPORT_TEMPLATE_HEADERS, type ImportResult } from "@/lib/actions/import-properties";
import { Button } from "@/components/ui/button";

const SAMPLE_ROW = [
  "venta",
  "apartamento",
  "nuevo",
  "distrito-nacional",
  "santo-domingo-dn",
  "piantini",
  "Apartamento 2 hab con línea blanca en Piantini",
  "Amplio apartamento en torre con seguridad 24/7, piscina y gimnasio. Excelente ubicación cerca de todo. Listo para entrega.",
  "2",
  "2",
  "1",
  "120",
  "",
  "215000",
  "USD",
  "no",
  "Calle Filomena Gómez de Cova",
  "gym;pool;security_24_7",
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267;https://images.unsplash.com/photo-1502672260266-1c1ef2d93688",
  "María Pérez",
  "8095551234",
  "maria@ejemplo.com",
];

function toCsvValue(v: string): string {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

export function CsvImport({ canImport }: { canImport: boolean }) {
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [rows, setRows] = React.useState<Record<string, string>[] | null>(null);
  const [fileName, setFileName] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [result, setResult] = React.useState<ImportResult | null>(null);

  const downloadTemplate = () => {
    const csv = [IMPORT_TEMPLATE_HEADERS.join(","), SAMPLE_ROW.map(toCsvValue).join(",")].join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla-inventario-paradise.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResult(null);
    setFileName(file.name);
    try {
      const text = await file.text();
      const parsed = csvToObjects(text);
      if (parsed.length === 0) {
        toast.error("El archivo no tiene filas de datos.");
        setRows(null);
        return;
      }
      setRows(parsed);
    } catch {
      toast.error("No pudimos leer el archivo.");
      setRows(null);
    }
  };

  const runImport = async () => {
    if (!rows) return;
    setPending(true);
    const res = await importProperties(rows);
    setPending(false);
    setResult(res);
    if (res.created > 0) {
      toast.success(res.message ?? "Importación completada");
      router.refresh();
    } else {
      toast.error(res.message ?? "No se importó ninguna propiedad");
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border/70 bg-card p-5">
        <h2 className="text-sm font-semibold">1. Descarga la plantilla</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Rellena una fila por propiedad. Los <code className="text-xs">*_slug</code> deben coincidir con
          las zonas del sitio (ej. <code className="text-xs">punta-cana</code>). Fotos y amenidades van
          separadas por <code className="text-xs">;</code>. Todo entra en <strong>revisión</strong> antes
          de publicarse.
        </p>
        <Button variant="outline" size="sm" className="mt-3" onClick={downloadTemplate}>
          <DownloadIcon className="size-4" />
          Descargar plantilla CSV
        </Button>
      </div>

      <div className="rounded-xl border border-border/70 bg-card p-5">
        <h2 className="text-sm font-semibold">2. Sube tu archivo</h2>
        <input ref={inputRef} type="file" accept=".csv,text/csv" onChange={onFile} className="hidden" />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={!canImport || pending}
          >
            <UploadIcon className="size-4" />
            Elegir CSV
          </Button>
          {fileName && <span className="text-sm text-muted-foreground">{fileName}</span>}
        </div>
        {!canImport && (
          <p className="mt-2 text-xs text-warning-foreground">
            Inicia sesión con una cuenta de inmobiliaria para importar.
          </p>
        )}

        {rows && !result && (
          <div className="mt-4 space-y-3">
            <p className="text-sm">
              <strong>{rows.length}</strong> fila{rows.length === 1 ? "" : "s"} detectada
              {rows.length === 1 ? "" : "s"}. Al importar quedan como “En revisión”.
            </p>
            <Button size="sm" onClick={runImport} disabled={pending}>
              {pending ? <Loader2Icon className="size-4 animate-spin" /> : <UploadIcon className="size-4" />}
              Importar {rows.length} propiedad{rows.length === 1 ? "" : "es"}
            </Button>
          </div>
        )}
      </div>

      {result && (
        <div className="rounded-xl border border-border/70 bg-card p-5">
          <h2 className="text-sm font-semibold">3. Resultado</h2>
          <p className="mt-1 text-sm">
            <span className="font-medium text-success">{result.created} creadas</span>
            {result.failed > 0 && (
              <>
                {" · "}
                <span className="font-medium text-destructive">{result.failed} con error</span>
              </>
            )}
          </p>
          <ul className="mt-3 max-h-72 space-y-1.5 overflow-y-auto text-sm">
            {result.rows.map((r) => (
              <li key={r.line} className="flex items-start gap-2">
                {r.ok ? (
                  <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-success" />
                ) : (
                  <XCircleIcon className="mt-0.5 size-4 shrink-0 text-destructive" />
                )}
                <span className="min-w-0">
                  <span className="text-muted-foreground">Fila {r.line}:</span> {r.title}
                  {r.ok ? (
                    <span className="text-muted-foreground"> — {r.code}</span>
                  ) : (
                    <span className="text-destructive"> — {r.error}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
          <Button
            variant="ghost"
            size="sm"
            className="mt-3"
            onClick={() => {
              setRows(null);
              setResult(null);
              setFileName("");
            }}
          >
            Importar otro archivo
          </Button>
        </div>
      )}
    </div>
  );
}
