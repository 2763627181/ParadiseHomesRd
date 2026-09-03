"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ConditionStatus, Currency, OperationType, PropertyType } from "@paradise/config";

export interface WizardImage {
  id: string;
  url: string;
  storagePath: string;
  isCover: boolean;
  alt?: string;
  uploading?: boolean;
}

export interface WizardData {
  // 1. Tipo
  operationType: OperationType | "";
  propertyType: PropertyType | "";
  conditionStatus: ConditionStatus | "";
  // 2. Ubicación
  provinceSlug: string;
  citySlug: string;
  sectorSlug: string;
  address: string;
  latitude?: number;
  longitude?: number;
  hideExactLocation: boolean;
  // 3. Información
  title: string;
  description: string;
  bedrooms: string;
  bathrooms: string;
  parkingSpaces: string;
  constructionM2: string;
  landM2: string;
  yearBuilt: string;
  floor: string;
  totalFloors: string;
  // 4. Precio
  priceOnRequest: boolean;
  price: string;
  currency: Currency;
  maintenanceFee: string;
  deliveryDate: string;
  // 5. Características
  amenityKeys: string[];
  furnished: boolean;
  petFriendly: boolean;
  airbnbFriendly: boolean;
  // 6. Multimedia
  images: WizardImage[];
  videoUrl: string;
  virtualTourUrl: string;
  // 7. Contacto
  contactName: string;
  contactPhone: string;
  contactWhatsapp: string;
  contactEmail: string;
  // 8. Review
  acceptTerms: boolean;
  // Anti-spam
  website: string;
}

const INITIAL: WizardData = {
  operationType: "",
  propertyType: "",
  conditionStatus: "",
  provinceSlug: "",
  citySlug: "",
  sectorSlug: "",
  address: "",
  hideExactLocation: false,
  title: "",
  description: "",
  bedrooms: "",
  bathrooms: "",
  parkingSpaces: "",
  constructionM2: "",
  landM2: "",
  yearBuilt: "",
  floor: "",
  totalFloors: "",
  priceOnRequest: false,
  price: "",
  currency: "USD",
  maintenanceFee: "",
  deliveryDate: "",
  amenityKeys: [],
  furnished: false,
  petFriendly: false,
  airbnbFriendly: false,
  images: [],
  videoUrl: "",
  virtualTourUrl: "",
  contactName: "",
  contactPhone: "",
  contactWhatsapp: "",
  contactEmail: "",
  acceptTerms: false,
  website: "",
};

interface WizardState {
  step: number;
  data: WizardData;
  hydrated: boolean;
  savedAt: number | null;
  set: (patch: Partial<WizardData>) => void;
  goTo: (step: number) => void;
  next: () => void;
  back: () => void;
  reset: () => void;
  addImages: (images: WizardImage[]) => void;
  updateImage: (id: string, patch: Partial<WizardImage>) => void;
  removeImage: (id: string) => void;
  reorderImages: (from: number, to: number) => void;
  setCover: (id: string) => void;
}

export const TOTAL_STEPS = 8;

export const useWizardStore = create<WizardState>()(
  persist(
    (set, get) => ({
      step: 0,
      data: INITIAL,
      hydrated: false,
      savedAt: null,
      set: (patch) => set((s) => ({ data: { ...s.data, ...patch }, savedAt: Date.now() })),
      goTo: (step) => set({ step: Math.max(0, Math.min(TOTAL_STEPS - 1, step)) }),
      next: () => set((s) => ({ step: Math.min(TOTAL_STEPS - 1, s.step + 1) })),
      back: () => set((s) => ({ step: Math.max(0, s.step - 1) })),
      reset: () => set({ step: 0, data: INITIAL, savedAt: null }),
      addImages: (images) =>
        set((s) => ({
          data: {
            ...s.data,
            images: [...s.data.images, ...images].map((img, i) => ({
              ...img,
              isCover: s.data.images.length === 0 && i === 0 ? true : img.isCover,
            })),
          },
          savedAt: Date.now(),
        })),
      updateImage: (id, patch) =>
        set((s) => ({
          data: {
            ...s.data,
            images: s.data.images.map((img) => (img.id === id ? { ...img, ...patch } : img)),
          },
        })),
      removeImage: (id) =>
        set((s) => {
          const images = s.data.images.filter((img) => img.id !== id);
          if (images.length && !images.some((img) => img.isCover)) images[0]!.isCover = true;
          return { data: { ...s.data, images }, savedAt: Date.now() };
        }),
      reorderImages: (from, to) =>
        set((s) => {
          const images = [...s.data.images];
          const [moved] = images.splice(from, 1);
          if (moved) images.splice(to, 0, moved);
          return { data: { ...s.data, images }, savedAt: Date.now() };
        }),
      setCover: (id) =>
        set((s) => ({
          data: {
            ...s.data,
            images: s.data.images.map((img) => ({ ...img, isCover: img.id === id })),
          },
          savedAt: Date.now(),
        })),
    }),
    {
      name: "ph_list_property_draft",
      version: 1,
      partialize: (s) => ({ step: s.step, data: s.data, savedAt: s.savedAt }),
      onRehydrateStorage: () => (s) => {
        if (s) s.hydrated = true;
      },
    },
  ),
);
