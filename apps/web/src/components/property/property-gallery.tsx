"use client";

import * as React from "react";
import Image from "next/image";
import { ChevronLeftIcon, ChevronRightIcon, ExpandIcon, XIcon } from "lucide-react";
import type { ImageAsset } from "@paradise/types";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export function PropertyGallery({
  images,
  title,
}: {
  images: ImageAsset[];
  title: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(0);
  const pics = images.length ? images : [];

  const openAt = (index: number) => {
    setActive(index);
    setOpen(true);
  };

  const step = (dir: 1 | -1) =>
    setActive((i) => (i + dir + pics.length) % pics.length);

  return (
    <>
      {/* Desktop: 1 grande + 4 pequeñas */}
      <div className="hidden gap-2 md:grid md:grid-cols-4 md:grid-rows-2">
        <button
          type="button"
          onClick={() => openAt(0)}
          className="relative col-span-2 row-span-2 aspect-4/3 overflow-hidden rounded-l-xl bg-muted"
        >
          {pics[0] && (
            <Image
              src={pics[0].url}
              alt={pics[0].alt ?? title}
              fill
              priority
              sizes="(max-width: 1024px) 50vw, 620px"
              className="object-cover transition-transform duration-500 hover:scale-[1.03]"
            />
          )}
        </button>
        {[1, 2, 3, 4].map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => openAt(i)}
            className={cn(
              "relative aspect-4/3 overflow-hidden bg-muted",
              i === 2 && "rounded-tr-xl",
              i === 4 && "rounded-br-xl",
            )}
          >
            {pics[i] && (
              <Image
                src={pics[i].url}
                alt={pics[i].alt ?? `${title} ${i + 1}`}
                fill
                sizes="320px"
                className="object-cover transition-transform duration-500 hover:scale-[1.04]"
              />
            )}
            {i === 4 && pics.length > 5 && (
              <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-sm font-medium text-white">
                +{pics.length - 5} fotos
              </span>
            )}
          </button>
        ))}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => openAt(0)}
          className="absolute bottom-4 right-4 shadow-md"
        >
          <ExpandIcon className="size-4" />
          Ver todas las fotos
        </Button>
      </div>

      {/* Mobile: carrusel swipe */}
      <div className="relative md:hidden">
        <div className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto">
          {pics.map((pic, i) => (
            <button
              key={pic.id}
              type="button"
              onClick={() => openAt(i)}
              className="relative aspect-4/3 w-full shrink-0 snap-center bg-muted"
            >
              <Image
                src={pic.url}
                alt={pic.alt ?? `${title} ${i + 1}`}
                fill
                priority={i === 0}
                sizes="100vw"
                className="object-cover"
              />
            </button>
          ))}
        </div>
        <span className="absolute bottom-3 right-3 rounded-full bg-black/55 px-2 py-0.5 text-xs text-white">
          {pics.length} fotos
        </span>
      </div>

      {/* Lightbox */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showClose={false}
          className="h-[100dvh] max-w-none rounded-none border-0 bg-black/95 p-0"
        >
          <div className="relative flex h-full flex-col">
            <div className="flex items-center justify-between p-4 text-white">
              <span className="text-sm">
                {active + 1} / {pics.length}
              </span>
              <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar">
                <XIcon className="size-6" />
              </button>
            </div>
            <div className="relative flex-1">
              {pics[active] && (
                <Image
                  src={pics[active].url}
                  alt={pics[active].alt ?? title}
                  fill
                  sizes="100vw"
                  className="object-contain"
                />
              )}
              {pics.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => step(-1)}
                    aria-label="Anterior"
                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                  >
                    <ChevronLeftIcon className="size-6" />
                  </button>
                  <button
                    type="button"
                    onClick={() => step(1)}
                    aria-label="Siguiente"
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                  >
                    <ChevronRightIcon className="size-6" />
                  </button>
                </>
              )}
            </div>
            <div className="no-scrollbar flex gap-2 overflow-x-auto p-4">
              {pics.map((pic, i) => (
                <button
                  key={pic.id}
                  type="button"
                  onClick={() => setActive(i)}
                  className={cn(
                    "relative size-16 shrink-0 overflow-hidden rounded-md",
                    i === active ? "ring-2 ring-white" : "opacity-60",
                  )}
                >
                  <Image src={pic.url} alt="" fill sizes="64px" className="object-cover" />
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
