import {
  Hoodie,
  Pants,
  HandPalm,
  Beanie,
  Sunglasses,
  Boot,
  Sock,
  TShirt,
  ShoppingBag,
  type Icon as PhosphorIcon,
} from '@phosphor-icons/react';
import { getTierColorClass, type ProductTier } from '../../../lib/productTier';

const CATEGORY_ICONS: Record<string, PhosphorIcon> = {
  jacket: Hoodie,
  base_layer: TShirt,
  pants: Pants,
  gloves: HandPalm,
  beanie: Beanie,
  goggles: Sunglasses,
  boots: Boot,
  socks: Sock,
  helmet: Hoodie,
  midlayer: TShirt,
  shell: Hoodie,
  accessory: ShoppingBag,
};


function resolveIcon(category?: string, name?: string): PhosphorIcon {
  if (category) {
    const key = category.toLowerCase().replace(/[\s-]/g, '_');
    if (CATEGORY_ICONS[key]) return CATEGORY_ICONS[key];
  }

  if (name) {
    const lower = name.toLowerCase();
    for (const [key, icon] of Object.entries(CATEGORY_ICONS)) {
      if (lower.includes(key.replace('_', ' ')) || lower.includes(key)) return icon;
    }
    if (lower.includes('bib')) return CATEGORY_ICONS.pants;
    if (lower.includes('mitten')) return CATEGORY_ICONS.gloves;
  }

  return ShoppingBag;
}

interface ProductIconProps {
  category?: string;
  name?: string;
  tier?: ProductTier;
  size?: number;
}

export function ProductIcon({
  category,
  name,
  tier,
  size = 64,
}: ProductIconProps) {
  const Icon = resolveIcon(category, name);
  const colorClass = tier ? getTierColorClass(tier) : 'text-muted-foreground';

  return (
    <Icon
      size={size}
      weight="fill"
      className={`transition-colors duration-200 ${colorClass}`}
    />
  );
}
