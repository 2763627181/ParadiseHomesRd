"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, ArrowRightIcon, CheckCircle2Icon, Loader2Icon } from "lucide-react";
import {
  AMENITIES,
  AMENITY_GROUP_LABELS,
  CONDITION_LABELS,
  CONDITION_STATUS,
  LOCATIONS,
  LOCATION_TYPE,
  OPERATION_TYPE,
  PROPERTY_TYPES,
  type AmenityGroup,
} from "@paradise/config";
import { formatRelativeRd } from "@paradise/utils/datetime";
import { formatPrice } from "@paradise/utils/currency";

import { cn } from "@/lib/utils";
import { analytics } from "@/lib/analytics";
import { submitPropertyListing } from "@/lib/actions/list-property";
import { useWizardStore, TOTAL_STEPS } from "@/features/list-property/wizard-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUploader } from "@/components/list-property/image-uploader";

const STEP_TITLES = [
  "Tipo de propiedad",
  "Ubicación",
  "Información",
  "Precio",
  "Características",
  "Fotos y video",
  "Contacto",
  "Revisión",
];

const provinces = LOCATIONS.filter((l) => l.type === LOCATION_TYPE.PROVINCE);

export function ListPropertyWizard() {
  const router = useRouter();
  const step = useWizardStore((s) => s.step);
  const data = useWizardStore((s) => s.data);
  const hydrated = useWizardStore((s) => s.hydrated);
  const savedAt = useWizardStore((s) => s.savedAt);
  const patch = useWizardStore((s) => s.set);
  const goTo = useWizardStore((s) => s.goTo);
  const next = useWizardStore((s) => s.next);
  const back = useWizardStore((s) => s.back);
  const reset = useWizardStore((s) => s.reset);

  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [doneCode, setDoneCode] = React.useState<string | null>(null);

  const cities = React.useMemo(
    () =>
      LOCATIONS.filter(
        (l) => l.type === LOCATION_TYPE.MUNICIPALITY && l.parentSlug === data.provinceSlug,
      ),
    [data.provinceSlug],
  );
  const sectors = React.useMemo(
    () => LOCATIONS.filter((l) => l.type === LOCATION_TYPE.SECTOR && l.parentSlug === data.citySlug),
    [data.citySlug],
  );

  const validateStep = (): string | null => {
    switch (step) {
      case 0:
        if (!data.operationType) return "Elige si es venta o alquiler.";
        if (!data.propertyType) return "Elige el tipo de propiedad.";
        if (!data.conditionStatus) return "Elige el estado de la propiedad.";
        return null;
      case 1:
        if (!data.provinceSlug) return "Selecciona la provincia.";
        if (!data.citySlug) return "Selecciona el municipio.";
        return null;
      case 2:
        if (data.title.trim().length < 8) return "El título debe tener al menos 8 caracteres.";
        if (data.description.trim().length < 40)
          return "La descripción debe tener al menos 40 caracteres.";
        return null;
      case 3:
        if (!data.priceOnRequest && !data.price) return "Ingresa el precio o marca «a consultar».";
        return null;
      case 5:
        if (data.images.length === 0) return "Sube al menos una foto.";
        return null;
      case 6:
        if (data.contactName.trim().length < 2) return "Ingresa un nombre de contacto.";
        if (!/^(\+?1)?8[024]9\d{7}$/.test(data.contactPhone.replace(/\D/g, "")))
          return "Ingresa un teléfono dominicano válido.";
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.contactEmail))
          return "Ingresa un correo válido.";
        return null;
      default:
        return null;
    }
  };

  const handleNext = () => {
    const err = validateStep();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    if (step === 0) analytics.track("search", { props: { surface: "list_property_start" } });
    next();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    if (!data.acceptTerms) {
      setError("Debes aceptar los términos para publicar.");
      return;
    }
    setError(null);
    setSubmitting(true);
    const result = await submitPropertyListing(data);
    setSubmitting(false);
    if (result.ok && result.code) {
      analytics.track("lead_created", { props: { channel: "list_property", code: result.code } });
      setDoneCode(result.code);
      return;
    }
    setError(result.message ?? "No pudimos publicar. Revisa los datos.");
    if (result.fieldErrors) {
      // Vuelve al primer paso con error
      const stepOfField: Record<string, number> = {
        operationType: 0,
        propertyType: 0,
        conditionStatus: 0,
        provinceSlug: 1,
        citySlug: 1,
        title: 2,
        description: 2,
        price: 3,
        images: 5,
        contactName: 6,
        contactPhone: 6,
        contactEmail: 6,
      };
      const first = Object.keys(result.fieldErrors)[0];
      if (first && stepOfField[first] !== undefined) goTo(stepOfField[first]!);
    }
  };

  if (!hydrated) {
    return <div className="h-96 animate-pulse rounded-xl bg-muted" />;
  }

  if (doneCode) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-verified/25 bg-verified/5 p-8 text-center">
        <CheckCircle2Icon className="mx-auto size-10 text-verified" />
        <h2 className="mt-3 text-xl font-semibold">¡Publicación recibida!</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Tu propiedad <strong>{doneCode}</strong> está en revisión. El equipo de Paradise la
          verifica y la publica, normalmente en menos de 24 horas. Te contactaremos si falta algo.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button asChild variant="outline">
            <Link href="/">Ir al inicio</Link>
          </Button>
          <Button
            onClick={() => {
              reset();
              setDoneCode(null);
            }}
          >
            Publicar otra
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Progreso */}
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium">
            Paso {step + 1} de {TOTAL_STEPS} · {STEP_TITLES[step]}
          </span>
          {savedAt && (
            <span className="text-xs text-muted-foreground">
              Borrador guardado {formatRelativeRd(savedAt)}
            </span>
          )}
        </div>
        <Progress value={((step + 1) / TOTAL_STEPS) * 100} />
      </div>

      <div className="rounded-2xl border border-border/70 bg-card p-6 sm:p-8">
        {step === 0 && <StepType />}
        {step === 1 && (
          <StepLocation
            cities={cities}
            sectors={sectors}
          />
        )}
        {step === 2 && <StepInfo />}
        {step === 3 && <StepPrice />}
        {step === 4 && <StepFeatures />}
        {step === 5 && <StepMedia />}
        {step === 6 && <StepContact />}
        {step === 7 && <StepReview goTo={goTo} />}

        {error && (
          <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="mt-8 flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            onClick={() => {
              setError(null);
              back();
            }}
            disabled={step === 0}
          >
            <ArrowLeftIcon className="size-4" />
            Atrás
          </Button>

          {step < TOTAL_STEPS - 1 ? (
            <Button onClick={handleNext}>
              Continuar
              <ArrowRightIcon className="size-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2Icon className="size-4 animate-spin" />}
              Publicar propiedad
            </Button>
          )}
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Tu borrador se guarda automáticamente en este dispositivo.{" "}
        <button className="underline" onClick={() => reset()}>
          Empezar de cero
        </button>
      </p>
    </div>
  );

  // ── Steps ────────────────────────────────────────────────────────────────
  function StepType() {
    return (
      <div className="space-y-6">
        <Field label="Operación">
          <div className="flex gap-1 rounded-lg bg-secondary p-1">
            {[OPERATION_TYPE.SALE, OPERATION_TYPE.RENT].map((op) => (
              <button
                key={op}
                type="button"
                onClick={() => patch({ operationType: op })}
                className={cn(
                  "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  data.operationType === op
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground",
                )}
              >
                {op === OPERATION_TYPE.SALE ? "Vender" : "Alquilar"}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Tipo de propiedad">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {PROPERTY_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => patch({ propertyType: t.value })}
                className={cn(
                  "rounded-lg border px-3 py-3 text-sm font-medium transition-colors",
                  data.propertyType === t.value
                    ? "border-primary bg-primary/5"
                    : "border-border text-muted-foreground hover:border-foreground/30",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Estado">
          <div className="flex flex-wrap gap-2">
            {Object.values(CONDITION_STATUS).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => patch({ conditionStatus: c })}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                  data.conditionStatus === c
                    ? "border-primary bg-primary/5"
                    : "border-border text-muted-foreground hover:border-foreground/30",
                )}
              >
                {CONDITION_LABELS[c]}
              </button>
            ))}
          </div>
        </Field>
      </div>
    );
  }

  function StepLocation({
    cities,
    sectors,
  }: {
    cities: typeof LOCATIONS;
    sectors: typeof LOCATIONS;
  }) {
    return (
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Provincia">
            <Select
              value={data.provinceSlug}
              onValueChange={(v) => patch({ provinceSlug: v, citySlug: "", sectorSlug: "" })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona" />
              </SelectTrigger>
              <SelectContent>
                {provinces.map((p) => (
                  <SelectItem key={p.slug} value={p.slug}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Municipio">
            <Select
              value={data.citySlug}
              onValueChange={(v) => patch({ citySlug: v, sectorSlug: "" })}
              disabled={!data.provinceSlug}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={data.provinceSlug ? "Selecciona" : "Elige provincia"} />
              </SelectTrigger>
              <SelectContent>
                {cities.map((c) => (
                  <SelectItem key={c.slug} value={c.slug}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        {sectors.length > 0 && (
          <Field label="Sector (opcional)">
            <Select value={data.sectorSlug} onValueChange={(v) => patch({ sectorSlug: v })}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona" />
              </SelectTrigger>
              <SelectContent>
                {sectors.map((s) => (
                  <SelectItem key={s.slug} value={s.slug}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        )}

        <Field label="Dirección o referencia (opcional)">
          <Input
            value={data.address}
            onChange={(e) => patch({ address: e.target.value })}
            placeholder="Calle, torre, punto de referencia…"
          />
        </Field>

        <label className="flex items-center gap-2.5 text-sm">
          <Checkbox
            checked={data.hideExactLocation}
            onCheckedChange={(v) => patch({ hideExactLocation: Boolean(v) })}
          />
          Ocultar la ubicación exacta en el mapa público (se comparte al contactar)
        </label>
      </div>
    );
  }

  function StepInfo() {
    return (
      <div className="space-y-5">
        <Field label="Título">
          <Input
            value={data.title}
            onChange={(e) => patch({ title: e.target.value })}
            placeholder="Ej. Apartamento contemporáneo en Piantini"
            maxLength={120}
          />
        </Field>
        <Field label="Descripción">
          <Textarea
            rows={5}
            value={data.description}
            onChange={(e) => patch({ description: e.target.value })}
            placeholder="Distribución, acabados, vista, cercanías, por qué es una buena oportunidad…"
            maxLength={5000}
          />
          <span className="text-xs text-muted-foreground">{data.description.length}/5000</span>
        </Field>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <NumField label="Habitaciones" k="bedrooms" />
          <NumField label="Baños" k="bathrooms" step="0.5" />
          <NumField label="Parqueos" k="parkingSpaces" />
          <NumField label="m² construcción" k="constructionM2" />
          <NumField label="m² terreno" k="landM2" />
          <NumField label="Año de construcción" k="yearBuilt" />
          <NumField label="Piso" k="floor" />
          <NumField label="Pisos del edificio" k="totalFloors" />
        </div>
      </div>
    );
  }

  function StepPrice() {
    return (
      <div className="space-y-5">
        <label className="flex items-center gap-2.5 text-sm">
          <Checkbox
            checked={data.priceOnRequest}
            onCheckedChange={(v) => patch({ priceOnRequest: Boolean(v) })}
          />
          Precio a consultar (no mostrar un monto)
        </label>

        {!data.priceOnRequest && (
          <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
            <Field label="Precio">
              <Input
                inputMode="numeric"
                value={data.price}
                onChange={(e) => patch({ price: e.target.value.replace(/[^\d.]/g, "") })}
                placeholder="185000"
              />
            </Field>
            <Field label="Moneda">
              <Select
                value={data.currency}
                onValueChange={(v) => patch({ currency: v as "USD" | "DOP" })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="DOP">DOP</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Mantenimiento mensual (opcional)">
            <Input
              inputMode="numeric"
              value={data.maintenanceFee}
              onChange={(e) => patch({ maintenanceFee: e.target.value.replace(/[^\d.]/g, "") })}
              placeholder="0"
            />
          </Field>
          {(data.conditionStatus === "OFF_PLAN" ||
            data.conditionStatus === "UNDER_CONSTRUCTION") && (
            <Field label="Fecha estimada de entrega">
              <Input
                type="date"
                value={data.deliveryDate}
                onChange={(e) => patch({ deliveryDate: e.target.value })}
              />
            </Field>
          )}
        </div>
      </div>
    );
  }

  function StepFeatures() {
    const groups = Array.from(new Set(AMENITIES.map((a) => a.group))) as AmenityGroup[];
    const toggle = (key: string) =>
      patch({
        amenityKeys: data.amenityKeys.includes(key)
          ? data.amenityKeys.filter((k) => k !== key)
          : [...data.amenityKeys, key],
      });
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["furnished", "Amueblado"],
              ["petFriendly", "Pet friendly"],
              ["airbnbFriendly", "Airbnb friendly"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => patch({ [k]: !data[k] } as never)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                data[k] ? "border-primary bg-primary/5" : "border-border text-muted-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {groups.map((g) => (
          <div key={g}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {AMENITY_GROUP_LABELS[g]}
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {AMENITIES.filter((a) => a.group === g).map((a) => (
                <label key={a.key} className="flex items-center gap-2.5 text-sm">
                  <Checkbox
                    checked={data.amenityKeys.includes(a.key)}
                    onCheckedChange={() => toggle(a.key)}
                  />
                  {a.label}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  function StepMedia() {
    return (
      <div className="space-y-5">
        <ImageUploader />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Video (YouTube/Vimeo, opcional)">
            <Input
              value={data.videoUrl}
              onChange={(e) => patch({ videoUrl: e.target.value })}
              placeholder="https://youtube.com/watch?v=…"
            />
          </Field>
          <Field label="Recorrido virtual (opcional)">
            <Input
              value={data.virtualTourUrl}
              onChange={(e) => patch({ virtualTourUrl: e.target.value })}
              placeholder="https://…"
            />
          </Field>
        </div>
      </div>
    );
  }

  function StepContact() {
    return (
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre de contacto">
            <Input
              value={data.contactName}
              onChange={(e) => patch({ contactName: e.target.value })}
            />
          </Field>
          <Field label="Teléfono">
            <Input
              inputMode="tel"
              value={data.contactPhone}
              onChange={(e) => patch({ contactPhone: e.target.value })}
              placeholder="809-123-4567"
            />
          </Field>
          <Field label="WhatsApp (si es distinto)">
            <Input
              inputMode="tel"
              value={data.contactWhatsapp}
              onChange={(e) => patch({ contactWhatsapp: e.target.value })}
            />
          </Field>
          <Field label="Correo">
            <Input
              type="email"
              value={data.contactEmail}
              onChange={(e) => patch({ contactEmail: e.target.value })}
            />
          </Field>
        </div>
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          className="hidden"
          value={data.website}
          onChange={(e) => patch({ website: e.target.value })}
        />
      </div>
    );
  }

  function StepReview({ goTo }: { goTo: (n: number) => void }) {
    const cover = data.images.find((i) => i.isCover) ?? data.images[0];
    const rows: [string, string, number][] = [
      ["Operación", data.operationType === "SALE" ? "Venta" : "Alquiler", 0],
      ["Tipo", PROPERTY_TYPES.find((t) => t.value === data.propertyType)?.label ?? "—", 0],
      [
        "Ubicación",
        [data.sectorSlug, data.citySlug, data.provinceSlug]
          .filter(Boolean)
          .map((s) => LOCATIONS.find((l) => l.slug === s)?.name)
          .filter(Boolean)
          .join(", "),
        1,
      ],
      [
        "Precio",
        data.priceOnRequest
          ? "A consultar"
          : formatPrice(Number(data.price) || 0, data.currency),
        3,
      ],
      [
        "Specs",
        [
          data.bedrooms && `${data.bedrooms} hab`,
          data.bathrooms && `${data.bathrooms} baños`,
          data.constructionM2 && `${data.constructionM2} m²`,
        ]
          .filter(Boolean)
          .join(" · ") || "—",
        2,
      ],
      ["Fotos", `${data.images.length}`, 5],
      ["Contacto", `${data.contactName} · ${data.contactPhone}`, 6],
    ];

    return (
      <div className="space-y-5">
        <div className="flex gap-4 rounded-xl border border-border/70 p-3">
          {cover && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={cover.url} alt="" className="size-20 rounded-lg object-cover" />
          )}
          <div>
            <p className="font-medium">{data.title || "Sin título"}</p>
            <p className="line-clamp-2 text-sm text-muted-foreground">{data.description}</p>
          </div>
        </div>

        <dl className="divide-y divide-border/70 rounded-xl border border-border/70">
          {rows.map(([label, value, s]) => (
            <div key={label} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="flex items-center gap-2 text-right font-medium">
                {value}
                <button
                  className="text-xs font-normal text-primary hover:underline"
                  onClick={() => goTo(s)}
                >
                  editar
                </button>
              </dd>
            </div>
          ))}
        </dl>

        <label className="flex items-start gap-2.5 text-sm">
          <Checkbox
            className="mt-0.5"
            checked={data.acceptTerms}
            onCheckedChange={(v) => patch({ acceptTerms: Boolean(v) })}
          />
          <span>
            Confirmo que la información es veraz y acepto los{" "}
            <Link href="/terms" className="underline">
              términos
            </Link>
            . La publicación pasa por revisión de Paradise antes de aparecer en el sitio.
          </span>
        </label>
      </div>
    );
  }
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function NumField({
  label,
  k,
  step,
}: {
  label: string;
  k:
    | "bedrooms"
    | "bathrooms"
    | "parkingSpaces"
    | "constructionM2"
    | "landM2"
    | "yearBuilt"
    | "floor"
    | "totalFloors";
  step?: string;
}) {
  const value = useWizardStore((s) => s.data[k]);
  const patch = useWizardStore((s) => s.set);
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input
        inputMode="decimal"
        step={step}
        value={value}
        onChange={(e) => patch({ [k]: e.target.value.replace(/[^\d.]/g, "") } as never)}
        className="h-10"
      />
    </div>
  );
}

