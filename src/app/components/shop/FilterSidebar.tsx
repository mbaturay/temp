"use client";

import React, { useMemo } from "react";
import { Slider } from "../ui/slider";
import type { Bundle } from "../../../lib/ai";

export interface FilterState {
  categories: string[];
  priceRange: { min: number; max: number };
  brands: string[];
  productTypes: string[];
  bundleStatus: string[];
}

interface FilterSidebarProps {
  bundle: Bundle;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  stylePriority: number;
  budgetPriority: number;
  onStyleChange: (value: number[]) => void;
  onBudgetChange: (value: number[]) => void;
  cartAdded: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  jacket: "Jackets",
  base_layer: "Base Layers",
  pants: "Pants",
  gloves: "Gloves",
  beanie: "Headwear",
  goggles: "Eyewear",
  boots: "Footwear",
  socks: "Socks",
};

const PRODUCT_TYPES = [
  { label: "Base Layers", value: "base_layers" },
  { label: "Jackets & Shells", value: "jackets_shells" },
  { label: "Boots & Shoes", value: "boots_shoes" },
  { label: "Accessories", value: "accessories" },
];

const BUNDLE_STATUSES = [
  "In my bundle",
  "Essential items",
  "Optional upgrades",
];

export function FilterSidebar({
  bundle,
  filters,
  onFiltersChange,
  stylePriority,
  budgetPriority,
  onStyleChange,
  onBudgetChange,
  cartAdded,
}: FilterSidebarProps) {
  const uniqueCategories = useMemo(() => {
    const cats = new Set<string>();
    bundle.items.forEach((item) => cats.add(item.catalogItem.category));
    return Array.from(cats);
  }, [bundle.items]);

  const uniqueBrands = useMemo(() => {
    const brands = new Set<string>();
    bundle.items.forEach((item) => brands.add(item.catalogItem.brand));
    return Array.from(brands).sort();
  }, [bundle.items]);

  function toggleArrayFilter(
    key: "categories" | "brands" | "productTypes" | "bundleStatus",
    value: string,
  ) {
    const current = filters[key];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onFiltersChange({ ...filters, [key]: next });
  }

  return (
    <aside className="w-[220px] shrink-0 rounded-xl border border-border bg-background">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-xs font-bold uppercase tracking-wider">
          Refine Your Bundle
        </h2>
        <p className="mt-1 text-[10px] text-muted-foreground leading-tight">
          Narrow down to specific gear types or price ranges
        </p>
      </div>

      {/* Style ↔ Performance */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-medium text-muted-foreground">
            Style
          </span>
          <span className="text-[10px] font-medium text-muted-foreground">
            Performance
          </span>
        </div>
        <Slider
          value={[stylePriority]}
          min={0}
          max={100}
          step={1}
          disabled={cartAdded}
          onValueChange={onStyleChange}
        />
      </div>

      {/* Budget ↔ Premium */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-medium text-muted-foreground">
            Budget
          </span>
          <span className="text-[10px] font-medium text-muted-foreground">
            Premium
          </span>
        </div>
        <Slider
          value={[budgetPriority]}
          min={0}
          max={100}
          step={1}
          disabled={cartAdded}
          onValueChange={onBudgetChange}
        />
      </div>

      {/* Category */}
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-xs font-bold uppercase tracking-wider mb-2">
          Category
        </h3>
        <div className="space-y-1.5">
          {uniqueCategories.map((cat) => (
            <label
              key={cat}
              className="flex items-center gap-2 text-xs cursor-pointer"
            >
              <input
                type="checkbox"
                checked={filters.categories.includes(cat)}
                onChange={() => toggleArrayFilter("categories", cat)}
                className="accent-primary"
              />
              {CATEGORY_LABELS[cat] ?? cat}
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-xs font-bold uppercase tracking-wider mb-2">
          Price Range
        </h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.priceRange.min || ""}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                priceRange: {
                  ...filters.priceRange,
                  min: Number(e.target.value) || 0,
                },
              })
            }
            className="w-full rounded border border-border bg-background px-2 py-1 text-xs"
          />
          <input
            type="number"
            placeholder="Max"
            value={filters.priceRange.max || ""}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                priceRange: {
                  ...filters.priceRange,
                  max: Number(e.target.value) || 0,
                },
              })
            }
            className="w-full rounded border border-border bg-background px-2 py-1 text-xs"
          />
        </div>
      </div>

      {/* Brand */}
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-xs font-bold uppercase tracking-wider mb-2">
          Brand
        </h3>
        <div className="space-y-1.5">
          {uniqueBrands.map((brand) => (
            <label
              key={brand}
              className="flex items-center gap-2 text-xs cursor-pointer"
            >
              <input
                type="checkbox"
                checked={filters.brands.includes(brand)}
                onChange={() => toggleArrayFilter("brands", brand)}
                className="accent-primary"
              />
              {brand}
            </label>
          ))}
        </div>
      </div>

      {/* Product Type */}
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-xs font-bold uppercase tracking-wider mb-2">
          Product Type
        </h3>
        <div className="space-y-1.5">
          {PRODUCT_TYPES.map((pt) => (
            <label
              key={pt.value}
              className="flex items-center gap-2 text-xs cursor-pointer"
            >
              <input
                type="checkbox"
                checked={filters.productTypes.includes(pt.value)}
                onChange={() => toggleArrayFilter("productTypes", pt.value)}
                className="accent-primary"
              />
              {pt.label}
            </label>
          ))}
        </div>
      </div>

      {/* Bundle Status */}
      <div className="px-4 py-3">
        <h3 className="text-xs font-bold uppercase tracking-wider mb-2">
          Bundle Status
        </h3>
        <div className="space-y-1.5">
          {BUNDLE_STATUSES.map((status) => (
            <label
              key={status}
              className="flex items-center gap-2 text-xs cursor-pointer"
            >
              <input
                type="checkbox"
                checked={filters.bundleStatus.includes(status)}
                onChange={() => toggleArrayFilter("bundleStatus", status)}
                className="accent-primary"
              />
              {status}
            </label>
          ))}
        </div>
      </div>
    </aside>
  );
}
