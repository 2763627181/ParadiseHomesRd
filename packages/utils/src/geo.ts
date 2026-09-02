/**
 * Utilidades geoespaciales para el mapa: distancia, bounds y "buscar en esta zona".
 */

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Bounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

const EARTH_RADIUS_KM = 6371;

export function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

export function isWithinBounds(point: LatLng, bounds: Bounds): boolean {
  return (
    point.lat <= bounds.north &&
    point.lat >= bounds.south &&
    point.lng <= bounds.east &&
    point.lng >= bounds.west
  );
}

export function boundsCenter(bounds: Bounds): LatLng {
  return {
    lat: (bounds.north + bounds.south) / 2,
    lng: (bounds.east + bounds.west) / 2,
  };
}

/** Bounds a partir de un centro y un radio en km (aprox.). */
export function boundsFromRadius(center: LatLng, radiusKm: number): Bounds {
  const latDelta = radiusKm / 111;
  const lngDelta = radiusKm / (111 * Math.cos(toRad(center.lat)) || 1);
  return {
    north: center.lat + latDelta,
    south: center.lat - latDelta,
    east: center.lng + lngDelta,
    west: center.lng - lngDelta,
  };
}

/** Bounds que contienen todos los puntos, con padding relativo. */
export function boundsFromPoints(points: LatLng[], paddingRatio = 0.15): Bounds | null {
  if (points.length === 0) return null;
  let north = -90;
  let south = 90;
  let east = -180;
  let west = 180;
  for (const p of points) {
    north = Math.max(north, p.lat);
    south = Math.min(south, p.lat);
    east = Math.max(east, p.lng);
    west = Math.min(west, p.lng);
  }
  const latPad = (north - south) * paddingRatio || 0.02;
  const lngPad = (east - west) * paddingRatio || 0.02;
  return {
    north: north + latPad,
    south: south - latPad,
    east: east + lngPad,
    west: west - lngPad,
  };
}

/** ¿El mapa se movió lo suficiente como para ofrecer "buscar en esta zona"? */
export function boundsChangedSignificantly(a: Bounds, b: Bounds, threshold = 0.2): boolean {
  const centerA = boundsCenter(a);
  const centerB = boundsCenter(b);
  const spanA = Math.max(a.north - a.south, a.east - a.west);
  const moved = haversineKm(centerA, centerB);
  const spanKm = spanA * 111;
  return spanKm > 0 && moved / spanKm > threshold;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
