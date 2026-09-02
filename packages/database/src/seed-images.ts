/**
 * Pool de imágenes para datos DEMO. IDs de Unsplash de arquitectura/interiores
 * (estables y de uso libre). Se combinan de forma determinista por propiedad.
 *
 * En producción las fotos vienen de Supabase Storage / R2.
 */

const UNSPLASH = (id: string, w = 1280) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=70`;

export const EXTERIOR_PHOTOS = [
  "1512917774080-9991f1c4c750",
  "1600585154340-be6161a56a0c",
  "1600596542815-ffad4c1539a9",
  "1512915922686-57c11dde9b6b",
  "1580587771525-78b9dba3b914",
  "1613490493576-7fde63acd811",
  "1568605114967-8130f3a36994",
  "1449844908441-8829872d2607",
  "1554995207-c18c203602cb",
  "1570129477492-45c003edd2be",
].map((id) => UNSPLASH(id));

export const INTERIOR_PHOTOS = [
  "1600607687939-ce8a6c25118c",
  "1600566753086-00f18fb6b3ea",
  "1600585154340-be6161a56a0c",
  "1600210492486-724fe5c67fb0",
  "1600047509807-ba8f99d2cdde",
  "1616486338812-3dadae4b4ace",
  "1616594039964-ae9021a400a0",
  "1502672260266-1c1ef2d93688",
  "1493809842364-78817add7ffb",
  "1522708323590-d24dbb6b0267",
  "1560448204-e02f11c3d0e2",
  "1556912173-3bb406ef7e77",
].map((id) => UNSPLASH(id));

export const AMENITY_PHOTOS = [
  "1571003123894-1f0594d2b5d9", // piscina
  "1534438327276-14e5300c3a48", // gym
  "1600607688969-a5bfcd646154", // lobby
  "1545324418-cc1a3fa10c00", // rooftop
].map((id) => UNSPLASH(id));

export const AGENT_AVATARS = [
  "1500648767791-00dcc994a43e",
  "1494790108377-be9c29b29330",
  "1507003211169-0a1dd7228f2d",
  "1438761681033-6461ffad8d80",
  "1472099645785-5658abf4ff4e",
  "1580489944761-15a19d654956",
  "1519085360753-af0119f7cbe7",
  "1534528741775-53994a69daeb",
  "1506794778202-cad84cf45f1d",
  "1517841905240-472988babdf9",
].map((id) => UNSPLASH(id, 400));

export const AGENCY_LOGOS = [
  "1560179707-f14e90ef3623",
  "1497366216548-37526070297c",
  "1486406146926-c627a92ad1ab",
].map((id) => UNSPLASH(id, 300));

export const PROJECT_PHOTOS = [
  "1545324418-cc1a3fa10c00",
  "1592595896551-12b371d546d5",
  "1580587771525-78b9dba3b914",
  "1493246507139-91e8fad9978e",
  "1567496898669-ee935f5f647a",
  "1600585154526-990dced4db0d",
].map((id) => UNSPLASH(id));

export function pickImages(pool: string[], seed: number, count: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    out.push(pool[(seed + i * 3) % pool.length]!);
  }
  return out;
}
