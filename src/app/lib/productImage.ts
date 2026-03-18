import type { CatalogItem } from '../../data/catalog';

// ── Build-time image map via Vite ────────────────────────────────────────────
const imageModules = import.meta.glob<string>('../../images/*.{png,jpg,jpeg,webp}', {
  eager: true,
  import: 'default',
});

function normalize(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');
}

// Map: normalized filename (without extension) → resolved asset URL
const imageMap = new Map<string, string>();
for (const [path, url] of Object.entries(imageModules)) {
  const filename = path.split('/').pop()!;
  const nameNoExt = filename.replace(/\.\w+$/, '');
  const key = normalize(nameNoExt);
  if (!imageMap.has(key)) {
    imageMap.set(key, url);
  }
}

// ── Gender-aware name parsing ────────────────────────────────────────────────
export interface ParsedProductName {
  baseName: string;
  gender: 'm' | 'w' | null;
  displayName: string;
}

export function parseProductName(name: string): ParsedProductName {
  if (name.endsWith(' - M')) {
    const base = name.slice(0, -4);
    return { baseName: base, gender: 'm', displayName: base };
  }
  if (name.endsWith(' - W')) {
    const base = name.slice(0, -4);
    return { baseName: base, gender: 'w', displayName: base };
  }
  return { baseName: name, gender: null, displayName: name };
}

// ── Image resolution ─────────────────────────────────────────────────────────
export function getProductImageSrc(product: CatalogItem): string | null {
  const { baseName, gender } = parseProductName(product.name);
  const base = normalize(baseName);

  // 1. Try gendered variant (e.g. "thermoflex-pro-ski-jacket-m")
  if (gender) {
    const gendered = imageMap.get(`${base}-${gender}`);
    if (gendered) return gendered;
  }

  // 2. Try exact base name (e.g. "powderrider-ski-pants")
  const exact = imageMap.get(base);
  if (exact) return exact;

  // 3. Try unisex variant (e.g. "allterrain-winter-boots-u")
  const unisex = imageMap.get(`${base}-u`);
  if (unisex) return unisex;

  return null;
}
