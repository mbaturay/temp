import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send } from 'lucide-react';
import { catalog, type CatalogItem, type Category } from '../../../data/catalog';
import {
  type Bundle,
  type BundleItem,
  type IntentData,
  generateRationale,
} from '../../../lib/ai';

// ── Types ────────────────────────────────────────────────────────────────────
interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

interface ParsedCommand {
  intent: string;
  target: string | null;
  budgetCap?: number | null;
}

interface AIAssistantDrawerProps {
  open: boolean;
  onClose: () => void;
  bundle: Bundle;
  intentData: IntentData;
  onBundleChange: (bundle: Bundle) => void;
  onHighlightCard: (itemId: string | null) => void;
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

// ── Suggestion chip sets ─────────────────────────────────────────────────────
const CHIP_SETS: Record<string, string[]> = {
  default: ['Make it warmer', 'Stay under $500', 'Add goggles', 'Remove accessories', 'Lightest kit'],
  warmer: ['Even warmer', 'Add a beanie', 'What about boots?'],
  lighter: ['Go ultralight', 'Remove heaviest item', 'Swap for lightweight'],
  cheaper: ['Cut more cost', 'Upgrade the jacket', 'Remove least essential'],
  remove: ['Replace with alternative', 'What am I missing?', 'Add it back'],
  add: ['Add more accessories', 'Stay under budget', 'Remove something'],
  swap: ['Swap another item', 'Make it cheaper', 'Optimize for warmth'],
  waterproof: ['Full waterproof kit', 'Make it warmer too', 'Lightest kit'],
  performance: ['Pro-level gear', 'Lightest setup', 'Stay under budget'],
  fallback: ['Make it warmer', 'Stay under $500', 'Swap the jacket', 'Lightest kit'],
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function recalcBundle(items: BundleItem[]): Bundle {
  const totalPrice = items.reduce((s, i) => s + i.catalogItem.price, 0);
  const originalPrice = items.reduce((s, i) => s + i.catalogItem.originalPrice, 0);
  return { items, totalPrice, originalPrice, savings: originalPrice - totalPrice };
}

function detectTarget(lower: string, bundleItems: BundleItem[]): string | null {
  // Check product names
  for (const p of catalog) {
    if (lower.includes(p.name.toLowerCase())) return p.id;
  }
  // Category keywords
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

// ── Component ────────────────────────────────────────────────────────────────
export function AIAssistantDrawer({
  open,
  onClose,
  bundle,
  intentData,
  onBundleChange,
  onHighlightCard,
}: AIAssistantDrawerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamedText, setStreamedText] = useState('');
  const [showTyping, setShowTyping] = useState(false);
  const [chips, setChips] = useState<string[]>(CHIP_SETS.default);
  const welcomeShownRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const bundleRef = useRef(bundle);
  bundleRef.current = bundle;

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, streamedText, scrollToBottom]);

  // Welcome message on first open
  useEffect(() => {
    if (open && !welcomeShownRef.current && bundle.items.length > 0) {
      welcomeShownRef.current = true;
      const count = bundle.items.length;
      const loc = intentData.location || 'your destination';
      const welcome = `Hey! I built a ${count}-item kit for your ${intentData.activity.toLowerCase()} trip to ${loc}. Want me to adjust anything? Try asking me to swap gear, tweak your budget, or optimize for warmth or weight.`;
      streamResponse(welcome);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  const streamResponse = async (text: string) => {
    setShowTyping(true);
    await delay(500);
    setShowTyping(false);
    setStreaming(true);
    setStreamedText('');

    for (let i = 0; i <= text.length; i++) {
      setStreamedText(text.slice(0, i));
      await delay(12);
    }

    setStreaming(false);
    setStreamedText('');
    setMessages(prev => [...prev, { role: 'assistant', text }]);
  };

  const handleSubmit = async () => {
    const text = inputValue.trim();
    if (!text || streaming || showTyping) return;
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', text }]);

    const currentBundle = bundleRef.current;
    const parsed = parseCommand(text, currentBundle.items);
    const { response, chipContext } = executeCommand(parsed, currentBundle);

    await streamResponse(response);
    setChips(CHIP_SETS[chipContext] || CHIP_SETS.default);
  };

  const handleChipClick = (chipText: string) => {
    setInputValue(chipText);
    setTimeout(() => {
      setInputValue('');
      setMessages(prev => [...prev, { role: 'user', text: chipText }]);
      const currentBundle = bundleRef.current;
      const parsed = parseCommand(chipText, currentBundle.items);
      const { response, chipContext } = executeCommand(parsed, currentBundle);
      streamResponse(response);
      setChips(CHIP_SETS[chipContext] || CHIP_SETS.default);
    }, 50);
  };

  // ── Command execution ─────────────────────────────────────────────────────
  const executeCommand = (parsed: ParsedCommand, currentBundle: Bundle): { response: string; chipContext: string } => {
    const { intent, target } = parsed;
    const items = currentBundle.items;
    const usedIds = items.map(i => i.catalogItem.id);
    const total = () => bundleRef.current.items.reduce((s, i) => s + i.catalogItem.price, 0);

    switch (intent) {
      case 'remove': {
        if (!target) return { response: noTargetMsg(), chipContext: 'fallback' };
        const item = items.find(i => i.catalogItem.id === target);
        if (!item) return { response: `That item isn't in your current kit.`, chipContext: 'fallback' };
        const newItems = items.filter(i => i.catalogItem.id !== target);
        onBundleChange(recalcBundle(newItems));
        return {
          response: `Done — removed **${item.catalogItem.name}**. Your new total is **$${recalcBundle(newItems).totalPrice.toFixed(0)}** with ${newItems.length} items.`,
          chipContext: 'remove',
        };
      }

      case 'add': {
        if (!target) return { response: `I'm not sure what to add. Try naming a category like "goggles" or "boots".`, chipContext: 'fallback' };
        if (usedIds.includes(target)) return { response: `That's already in your kit!`, chipContext: 'fallback' };
        const catalogItem = catalog.find(c => c.id === target);
        if (!catalogItem) return { response: `I couldn't find that in our catalog.`, chipContext: 'fallback' };
        const newItem: BundleItem = { catalogItem, rationale: generateRationale(catalogItem) };
        const newItems = [...items, newItem];
        onBundleChange(recalcBundle(newItems));
        onHighlightCard(catalogItem.id);
        return {
          response: `Added **${catalogItem.name}** to your kit! Total is now **$${recalcBundle(newItems).totalPrice.toFixed(0)}** for ${newItems.length} items.`,
          chipContext: 'add',
        };
      }

      case 'swap': {
        const itemToSwap = target
          ? items.find(i => i.catalogItem.id === target)
          : items.find(i => !!findAlt(i.catalogItem, usedIds));
        if (!itemToSwap) return { response: `Nothing available to swap right now.`, chipContext: 'fallback' };
        const alt = findAlt(itemToSwap.catalogItem, usedIds);
        if (!alt) return { response: `No alternative found for **${itemToSwap.catalogItem.name}**.`, chipContext: 'fallback' };
        const newItems = items.map(i =>
          i.catalogItem.id === itemToSwap.catalogItem.id
            ? { catalogItem: alt, rationale: generateRationale(alt) }
            : i
        );
        onBundleChange(recalcBundle(newItems));
        onHighlightCard(alt.id);
        const diff = alt.price - itemToSwap.catalogItem.price;
        const diffStr = diff > 0 ? `+$${diff}` : `-$${Math.abs(diff)}`;
        return {
          response: `Swapped **${itemToSwap.catalogItem.name}** → **${alt.name}** (${diffStr}). Total: **$${recalcBundle(newItems).totalPrice.toFixed(0)}**.`,
          chipContext: 'swap',
        };
      }

      case 'cheaper': {
        let swapped: string[] = [];
        let newItems = [...items];
        const targetTotal = parsed.budgetCap || Math.round(total() * 0.75);
        // Swap expensive items for cheaper alts
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
            swapped.push(`${item.catalogItem.name} → **${alt.name}**`);
          }
        }
        // Remove secondary items if still over
        const secondary: Category[] = ['socks', 'beanie', 'goggles', 'boots'];
        while (newItems.reduce((s, i) => s + i.catalogItem.price, 0) > targetTotal) {
          const removable = newItems.find(i => secondary.includes(i.catalogItem.category));
          if (!removable) break;
          swapped.push(`removed **${removable.catalogItem.name}**`);
          newItems = newItems.filter(i => i.catalogItem.id !== removable.catalogItem.id);
        }
        if (swapped.length === 0) return { response: `Your kit is already well-optimized for budget!`, chipContext: 'cheaper' };
        onBundleChange(recalcBundle(newItems));
        return {
          response: `Budget optimized! ${swapped.join(', ')}. New total: **$${recalcBundle(newItems).totalPrice.toFixed(0)}**.`,
          chipContext: 'cheaper',
        };
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
        let swapped: string[] = [];
        let newItems = [...items];
        for (const item of [...items]) {
          const currentIds = newItems.map(i => i.catalogItem.id);
          const alt = catalog.find(
            c => c.category === item.catalogItem.category
              && c.id !== item.catalogItem.id
              && !currentIds.includes(c.id)
              && c.tags.includes(tag)
              && !item.catalogItem.tags.includes(tag)
          );
          if (alt) {
            newItems = newItems.map(i =>
              i.catalogItem.id === item.catalogItem.id
                ? { catalogItem: alt, rationale: generateRationale(alt) }
                : i
            );
            swapped.push(`**${item.catalogItem.name}** → **${alt.name}**`);
            onHighlightCard(alt.id);
          }
        }
        if (swapped.length === 0) return { response: `Your kit is already optimized for ${label}!`, chipContext: intent };
        onBundleChange(recalcBundle(newItems));
        return {
          response: `Optimized for ${label}! Swapped ${swapped.join(', ')}. Total: **$${recalcBundle(newItems).totalPrice.toFixed(0)}**.`,
          chipContext: intent,
        };
      }

      default:
        return {
          response: `I can help you **swap**, **add**, or **remove** gear, adjust for **budget**, or optimize for **warmth**, **weight**, or **waterproofing**. Try "make it warmer" or "remove the socks".`,
          chipContext: 'fallback',
        };
    }
  };

  const noTargetMsg = () => `I'm not sure which item you mean. Try naming a specific product or category like "jacket" or "socks".`;

  return (
    <div
      className={`fixed top-0 right-0 w-full sm:w-[400px] h-full z-[200] flex flex-col bg-background/95 backdrop-blur-xl border-l border-border shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        open ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="size-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                <span
                  className="text-xs tracking-[0.15em] uppercase text-muted-foreground"
                  style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 500 }}
                >
                  AI Assistant
                </span>
              </div>
              <button
                onClick={onClose}
                className="size-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className={`max-w-[85%] px-3.5 py-2.5 text-[13px] leading-relaxed ${
                    msg.role === 'user'
                      ? 'ml-auto bg-blue-600 text-white rounded-2xl rounded-br-md'
                      : 'mr-auto bg-muted text-foreground rounded-2xl rounded-bl-md'
                  }`}
                  style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 400 }}
                  dangerouslySetInnerHTML={{
                    __html: msg.text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>'),
                  }}
                />
              ))}

              {/* Typing indicator */}
              <AnimatePresence>
                {showTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="flex gap-1 px-4 py-3 bg-muted rounded-2xl rounded-bl-md w-fit"
                  >
                    {[0, 1, 2].map(i => (
                      <motion.div
                        key={i}
                        className="size-1.5 rounded-full bg-muted-foreground"
                        animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Streaming text */}
              {streaming && streamedText && (
                <div
                  className="max-w-[85%] mr-auto px-3.5 py-2.5 bg-muted text-foreground rounded-2xl rounded-bl-md text-[13px] leading-relaxed"
                  style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 400 }}
                  dangerouslySetInnerHTML={{
                    __html: streamedText.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>'),
                  }}
                />
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggestion chips */}
            <div className="shrink-0 flex gap-1.5 px-4 py-2 overflow-x-auto scrollbar-none">
              {chips.map(chip => (
                <button
                  key={chip}
                  onClick={() => handleChipClick(chip)}
                  disabled={streaming || showTyping}
                  className="shrink-0 px-3 py-1.5 rounded-full text-[11px] bg-blue-500/10 text-blue-600 border border-blue-500/20 hover:bg-blue-500/20 hover:border-blue-500/35 transition-all disabled:opacity-50 whitespace-nowrap"
                  style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 500 }}
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="shrink-0 flex gap-2 px-4 py-3 border-t border-border">
              <input
                ref={inputRef}
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
                placeholder="Ask me to adjust your kit..."
                disabled={streaming || showTyping}
                className="flex-1 bg-muted border border-border rounded-xl px-3.5 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all disabled:opacity-50"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              />
              <button
                onClick={handleSubmit}
                disabled={!inputValue.trim() || streaming || showTyping}
                className="size-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="size-4" />
              </button>
            </div>
    </div>
  );
}

function delay(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}
