/**
 * Imágenes de portada para las zonas destacadas (bloque "búsquedas rápidas").
 * IDs de Unsplash. Reemplazables por fotografía propia más adelante.
 */

const U = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=900&q=70`;

export const LOCATION_IMAGES: Record<string, string> = {
  "distrito-nacional": U("1596436889106-be35e843f974"),
  "santo-domingo-dn": U("1596436889106-be35e843f974"),
  "santo-domingo": U("1596436889106-be35e843f974"),
  "santo-domingo-este": U("1567496898669-ee935f5f647a"),
  "santo-domingo-norte": U("1449844908441-8829872d2607"),
  "santo-domingo-oeste": U("1512917774080-9991f1c4c750"),
  "boca-chica": U("1507525428034-b723cf961d3e"),
  santiago: U("1600585154340-be6161a56a0c"),
  "santiago-de-los-caballeros": U("1600585154340-be6161a56a0c"),
  "la-altagracia": U("1520250497591-112f2f40a3f4"),
  "punta-cana": U("1520250497591-112f2f40a3f4"),
  bavaro: U("1544551763-46a013bb70d5"),
  "cap-cana": U("1582719508461-905c673771fd"),
  "la-romana": U("1610641818989-c2051b5e2cfd"),
  "casa-de-campo": U("1613490493576-7fde63acd811"),
  "puerto-plata": U("1559599238-308793637427"),
  cabarete: U("1502933691298-84fc14542831"),
  sosua: U("1505142468610-359e7d316be0"),
  samana: U("1439066615861-d1af74d74000"),
  "las-terrenas": U("1519046904884-53103b34b206"),
  "juan-dolio": U("1507525428034-b723cf961d3e"),
  jarabacoa: U("1470071459604-3b5ec3a7fe05"),
  piantini: U("1545324418-cc1a3fa10c00"),
  naco: U("1493246507139-91e8fad9978e"),
};

export function locationImage(slug: string): string {
  return LOCATION_IMAGES[slug] ?? U("1512917774080-9991f1c4c750");
}
