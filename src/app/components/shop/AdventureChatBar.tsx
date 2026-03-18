'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCcw, Send, MessageSquare } from 'lucide-react';
import { catalog, type CatalogItem, type Category } from '../../../data/catalog';
import {
  type Bundle,
  type BundleItem,
  type IntentData,
  generateRationale,
} from '../../../lib/ai';

// ── Types ────────────────────────────────────────────────────────────────────
interface AdventureChatBarProps {
  intentData: IntentData;
  bundle: Bundle;
  onBundleChange: (bundle: Bundle) => void;
  onStartOver: () => void;
}

interface ParsedCommand {
  intent: string;
  target: string | null;
  budgetCap?: number | null;
}

// ── Category keyword map ─────────────────────────────────────────────────────
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  jacket: ['jacket', 'shell', 'parka', 'coat', 'down'],
  base_layer: ['base layer', 'base', 'crew', 'half-zip', 'fleece', 'thermal'],
  pants: ['pants', 'bib', 'bibs', 'ski pants', 'trousers'],
  gloves: ['glove', 'gloves', 'mitten', 'mittens'],
  goggles: ['goggles', 'goggle', 'googles', 'lens', 'lenses'],
  beanie: ['beanie', 'hat', 'toque', 'headband'],
  boots: ['boots', 'boot', 'footwear', 'shoes'],
  socks: ['socks', 'sock'],
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function recalcBundle(items: BundleItem[]): Bundle {
  const totalPrice = items.reduce((s, i) => s + i.catalogItem.price, 0);
  const originalPrice = items.reduce((s, i) => s + i.catalogItem.originalPrice, 0);
  return { items, totalPrice, originalPrice, savings: originalPrice - totalPrice };
}

function detectTarget(lower: string, bundleItems: BundleItem[]): string | null {
  for (const p of catalog) {
    if (lower.includes(p.name.toLowerCase())) return p.id;
  }
  for (const [catPrefix, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        const inBundle = bundleItems.find(i => i.catalogItem.category === catPrefix);
        if (inBundle) return inBundle.catalogItem.id;
        const inCatalog = catalog.find(c => c.category === catPrefix);
        if (inCatalog) return inCatalog.id;
      }
    }
  }
  return null;
}

function parseCommand(input: string, bundleItems: BundleItem[]): ParsedCommand {
  const lower = input.toLowerCase();
  const target = detectTarget(lower, bundleItems);

  if (/remove|drop|don'?t need|get rid|take out|ditch/.test(lower))
    return { intent: 'remove', target };
  if (/add|include|throw in|need|get me/.test(lower))
    return { intent: 'add', target };
  if (/swap|switch|replace|change|different|another/.test(lower))
    return { intent: 'swap', target };
  if (/cheap|budget|save|under \$(\d+)|cut cost/.test(lower)) {
    const m = lower.match(/under \$(\d+)/);
    return { intent: 'cheaper', target, budgetCap: m ? parseInt(m[1]) : null };
  }
  if (/warm|cold|freezing|insulate|cozy/.test(lower))
    return { intent: 'warmer', target };
  if (/light|weight|ultralight|minimal/.test(lower))
    return { intent: 'lighter', target };
  if (/waterproof|rain|wet|storm|dry/.test(lower))
    return { intent: 'waterproof', target };
  if (/performance|fast|pro|technical|advanced/.test(lower))
    return { intent: 'performance', target };
  return { intent: 'fallback', target: null };
}

function findAlt(item: CatalogItem, excludeIds: string[]): CatalogItem | undefined {
  return catalog.find(
    c => c.category === item.category && c.id !== item.id && !excludeIds.includes(c.id)
  );
}

function noTargetMsg() {
  return "I'm not sure which item you mean. Try naming a category like \"jacket\" or \"socks\".";
}

// ── Command execution ────────────────────────────────────────────────────────
function executeCommand(
  parsed: ParsedCommand,
  currentBundle: Bundle,
  onBundleChange: (bundle: Bundle) => void,
): string {
  const { intent, target } = parsed;
  const items = currentBundle.items;
  const usedIds = items.map(i => i.catalogItem.id);
  const total = () => items.reduce((s, i) => s + i.catalogItem.price, 0);

  switch (intent) {
    case 'remove': {
      if (!target) return noTargetMsg();
      const item = items.find(i => i.catalogItem.id === target);
      if (!item) return "That item isn't in your current kit.";
      const newItems = items.filter(i => i.catalogItem.id !== target);
      onBundleChange(recalcBundle(newItems));
      return `Removed ${item.catalogItem.name}. New total: $${recalcBundle(newItems).totalPrice.toFixed(0)} (${newItems.length} items).`;
    }

    case 'add': {
      if (!target) return 'Not sure what to add. Try naming a category like "goggles" or "boots".';
      if (usedIds.includes(target)) return "That's already in your kit!";
      const catalogItem = catalog.find(c => c.id === target);
      if (!catalogItem) return "Couldn't find that in our catalog.";
      const newItem: BundleItem = { catalogItem, rationale: generateRationale(catalogItem) };
      const newItems = [...items, newItem];
      onBundleChange(recalcBundle(newItems));
      return `Added ${catalogItem.name}. Total: $${recalcBundle(newItems).totalPrice.toFixed(0)} for ${newItems.length} items.`;
    }

    case 'swap': {
      const itemToSwap = target
        ? items.find(i => i.catalogItem.id === target)
        : items.find(i => !!findAlt(i.catalogItem, usedIds));
      if (!itemToSwap) return 'Nothing available to swap right now.';
      const alt = findAlt(itemToSwap.catalogItem, usedIds);
      if (!alt) return `No alternative found for ${itemToSwap.catalogItem.name}.`;
      const newItems = items.map(i =>
        i.catalogItem.id === itemToSwap.catalogItem.id
          ? { catalogItem: alt, rationale: generateRationale(alt) }
          : i
      );
      onBundleChange(recalcBundle(newItems));
      const diff = alt.price - itemToSwap.catalogItem.price;
      const diffStr = diff > 0 ? `+$${diff}` : `-$${Math.abs(diff)}`;
      return `Swapped ${itemToSwap.catalogItem.name} → ${alt.name} (${diffStr}). Total: $${recalcBundle(newItems).totalPrice.toFixed(0)}.`;
    }

    case 'cheaper': {
      const swapped: string[] = [];
      let newItems = [...items];
      const targetTotal = parsed.budgetCap || Math.round(total() * 0.75);

      const sorted = [...newItems].sort((a, b) => b.catalogItem.price - a.catalogItem.price);
      for (const item of sorted) {
        if (newItems.reduce((s, i) => s + i.catalogItem.price, 0) <= targetTotal) break;
        const currentIds = newItems.map(i => i.catalogItem.id);
        const alt = catalog.find(
          c => c.category === item.catalogItem.category && c.price < item.catalogItem.price && !currentIds.includes(c.id)
        );
        if (alt) {
          newItems = newItems.map(i =>
            i.catalogItem.id === item.catalogItem.id
              ? { catalogItem: alt, rationale: generateRationale(alt) }
              : i
          );
          swapped.push(`${item.catalogItem.name} → ${alt.name}`);
        }
      }

      const secondary: Category[] = ['socks', 'beanie', 'goggles', 'boots'];
      while (newItems.reduce((s, i) => s + i.catalogItem.price, 0) > targetTotal) {
        const removable = newItems.find(i => secondary.includes(i.catalogItem.category));
        if (!removable) break;
        swapped.push(`removed ${removable.catalogItem.name}`);
        newItems = newItems.filter(i => i.catalogItem.id !== removable.catalogItem.id);
      }

      if (swapped.length === 0) return 'Your kit is already well-optimized for budget!';
      onBundleChange(recalcBundle(newItems));
      return `Budget optimized! ${swapped.join(', ')}. New total: $${recalcBundle(newItems).totalPrice.toFixed(0)}.`;
    }

    case 'warmer':
    case 'lighter':
    case 'waterproof':
    case 'performance': {
      const attrMap: Record<string, { tag: string; label: string }> = {
        warmer: { tag: 'warm', label: 'warmth' },
        lighter: { tag: 'lightweight', label: 'weight' },
        waterproof: { tag: 'waterproof', label: 'waterproofing' },
        performance: { tag: 'premium', label: 'performance' },
      };
      const { tag, label } = attrMap[intent];
      const swapped: string[] = [];
      let newItems = [...items];

      for (const item of [...items]) {
        const currentIds = newItems.map(i => i.catalogItem.id);
        const alt = catalog.find(
          c =>
            c.category === item.catalogItem.category &&
            c.id !== item.catalogItem.id &&
            !currentIds.includes(c.id) &&
            c.tags.includes(tag) &&
            !item.catalogItem.tags.includes(tag)
        );
        if (alt) {
          newItems = newItems.map(i =>
            i.catalogItem.id === item.catalogItem.id
              ? { catalogItem: alt, rationale: generateRationale(alt) }
              : i
          );
          swapped.push(`${item.catalogItem.name} → ${alt.name}`);
        }
      }

      if (swapped.length === 0) return `Your kit is already optimized for ${label}!`;
      onBundleChange(recalcBundle(newItems));
      return `Optimized for ${label}! ${swapped.join(', ')}. Total: $${recalcBundle(newItems).totalPrice.toFixed(0)}.`;
    }

    default:
      return 'I can help you swap, add, or remove gear, adjust for budget, or optimize for warmth, weight, or waterproofing. Try "make it warmer" or "remove the socks".';
  }
}

// ── Component ────────────────────────────────────────────────────────────────
export function AdventureChatBar({
  intentData,
  bundle,
  onBundleChange,
  onStartOver,
}: AdventureChatBarProps) {
  const [inputValue, setInputValue] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bundleRef = useRef(bundle);
  bundleRef.current = bundle;

  const showToast = useCallback((message: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(message);
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 4000);
  }, []);

  const handleSubmit = useCallback(() => {
    const text = inputValue.trim();
    if (!text || isProcessing) return;

    setInputValue('');
    setIsProcessing(true);

    const currentBundle = bundleRef.current;
    const parsed = parseCommand(text, currentBundle.items);
    const response = executeCommand(parsed, currentBundle, onBundleChange);

    showToast(response);
    setIsProcessing(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [inputValue, isProcessing, onBundleChange, showToast]);

  // Build trip context string
  const contextParts = [
    intentData.activity,
    intentData.location,
    intentData.season || intentData.month,
    intentData.skillLevel,
  ].filter(Boolean);
  const contextString = contextParts.join(' · ');

  return (
    <div
      className="w-full bg-foreground text-background"
      style={{ fontFamily: "'Outfit', sans-serif" }}
    >
      {/* Toast response */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="w-full px-6 py-2.5 bg-blue-600 text-white text-[13px] leading-relaxed flex items-center gap-2"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            <MessageSquare className="size-3.5 shrink-0 opacity-70" />
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main bar */}
      <div className="w-full px-6 py-3 flex items-center gap-4">
        {/* Left: Title + context */}
        <div className="shrink-0 hidden sm:flex flex-col gap-0.5 min-w-0">
          <span className="text-sm font-semibold tracking-tight truncate">
            Your Adventure
          </span>
          <span className="text-[11px] opacity-60 truncate">
            {contextString}
          </span>
        </div>

        {/* Center: Input */}
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="Not seeing what you need? Tell us more..."
              disabled={isProcessing}
              className="w-full bg-white/10 text-background placeholder:text-background/40 rounded-full px-4 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all disabled:opacity-50"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={!inputValue.trim() || isProcessing}
            className="size-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 hover:bg-blue-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            <Send className="size-3.5" />
          </button>
        </div>

        {/* Right: Start Over */}
        <button
          onClick={onStartOver}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium bg-white/10 hover:bg-white/20 transition-colors"
          style={{ fontFamily: "'Outfit', sans-serif" }}
        >
          <RotateCcw className="size-3.5" />
          <span className="hidden sm:inline">Start Over</span>
        </button>
      </div>
    </div>
  );
}
