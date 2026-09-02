import {
  AirVentIcon,
  AnchorIcon,
  BabyIcon,
  CheckIcon,
  DumbbellIcon,
  FlagIcon,
  FlameIcon,
  LandmarkIcon,
  LaptopIcon,
  PawPrintIcon,
  SailboatIcon,
  ShieldCheckIcon,
  SofaIcon,
  WavesIcon,
  ZapIcon,
  type LucideIcon,
} from "lucide-react";
import { AMENITIES_BY_KEY, AMENITY_GROUP_LABELS, type AmenityGroup } from "@paradise/config";

const ICONS: Record<string, LucideIcon> = {
  Sofa: SofaIcon,
  Waves: WavesIcon,
  Dumbbell: DumbbellIcon,
  ShieldCheck: ShieldCheckIcon,
  Zap: ZapIcon,
  Baby: BabyIcon,
  Landmark: LandmarkIcon,
  Laptop: LaptopIcon,
  Flame: FlameIcon,
  PawPrint: PawPrintIcon,
  Flag: FlagIcon,
  Anchor: AnchorIcon,
  Sailboat: SailboatIcon,
  AirVent: AirVentIcon,
};

export function PropertyAmenities({ keys }: { keys: string[] }) {
  const amenities = keys.map((key) => AMENITIES_BY_KEY[key]).filter(Boolean);
  if (amenities.length === 0) return null;

  const groups = new Map<AmenityGroup, typeof amenities>();
  for (const amenity of amenities) {
    const list = groups.get(amenity!.group) ?? [];
    list.push(amenity);
    groups.set(amenity!.group, list);
  }

  return (
    <div className="space-y-6">
      {[...groups.entries()].map(([group, items]) => (
        <div key={group}>
          <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
            {AMENITY_GROUP_LABELS[group]}
          </h3>
          <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {items.map((amenity) => {
              const Icon = ICONS[amenity!.icon] ?? CheckIcon;
              return (
                <li key={amenity!.key} className="flex items-center gap-2.5 text-sm">
                  <Icon className="size-4 shrink-0 text-muted-foreground" />
                  {amenity!.label}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
