export type UUID = string;
export type ISODateString = string;

export interface ImageAsset {
  id: UUID;
  url: string;
  /** ruta en storage; para firmar/transformar */
  storagePath?: string | null;
  alt?: string | null;
  width?: number | null;
  height?: number | null;
  blurDataUrl?: string | null;
  position: number;
  isCover: boolean;
}

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface Money {
  amount: number | null;
  currency: "USD" | "DOP";
  /** true => "Precio a consultar" */
  onRequest?: boolean;
  /** para alquiler */
  period?: "month" | null;
}

export interface Paginated<T> {
  items: T[];
  nextCursor: string | null;
  total?: number;
}

export interface Result<T> {
  ok: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    /** errores por campo para formularios */
    fields?: Record<string, string>;
  };
}

export interface VideoAsset {
  provider: "youtube" | "vimeo" | "file";
  url: string;
  thumbnailUrl?: string | null;
  title?: string | null;
}
