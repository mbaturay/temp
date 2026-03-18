import { useState } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, FlaskConical, Tag, Trash2, Minus, Plus } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
import { Badge } from '../components/ui/badge';
import { useCart, type CartItem } from '../lib/cart-context';
import { ProductDetailPanel } from '../components/shop/ProductDetailPanel';
import { catalog, type CatalogItem } from '../../data/catalog';
import { generateRationale, type BundleItem, type Bundle } from '../../lib/ai';
import { getProductImageSrc, parseProductName } from '../lib/productImage';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

const CATEGORY_LABELS: Record<string, string> = {
  jacket: 'Jacket',
  base_layer: 'Base Layer',
  pants: 'Pants',
  gloves: 'Gloves',
  beanie: 'Beanie',
  goggles: 'Goggles',
  boots: 'Boots',
  socks: 'Socks',
};

/** Look up the full CatalogItem from the static catalog by id */
function findCatalogItem(id: string): CatalogItem | undefined {
  return catalog.find((c) => c.id === id);
}

/** Build a BundleItem from a CartItem (needs catalog lookup for full data) */
function toBundleItem(cartItem: CartItem): BundleItem | null {
  const catalogItem = findCatalogItem(cartItem.id);
  if (!catalogItem) return null;
  return { catalogItem, rationale: cartItem.rationale };
}

/** Build a pseudo-Bundle from the current cart items for alternatives lookup */
function toBundle(items: CartItem[]): Bundle {
  const bundleItems: BundleItem[] = [];
  for (const ci of items) {
    const bi = toBundleItem(ci);
    if (bi) bundleItems.push(bi);
  }
  return {
    items: bundleItems,
    totalPrice: items.reduce((s, i) => s + i.price * i.quantity, 0),
    originalPrice: items.reduce((s, i) => s + i.originalPrice * i.quantity, 0),
    savings: items.reduce((s, i) => s + (i.originalPrice - i.price) * i.quantity, 0),
  };
}

export default function Checkout() {
  const { items, totalPrice, originalPrice, savings, removeItem, replaceItem, updateQuantity, clearCart } = useCart();
  const [pdpCartItem, setPdpCartItem] = useState<CartItem | null>(null);
  const [pdpOpen, setPdpOpen] = useState(false);

  const handleProductClick = (item: CartItem) => {
    setPdpCartItem(item);
    setPdpOpen(true);
  };

  const handleReplace = (newCatalogItem: CatalogItem, oldItemId: string) => {
    replaceItem(oldItemId, {
      id: newCatalogItem.id,
      name: newCatalogItem.name,
      brand: newCatalogItem.brand,
      price: newCatalogItem.price,
      originalPrice: newCatalogItem.originalPrice,
      image: newCatalogItem.image,
      category: newCatalogItem.category,
      rationale: generateRationale(newCatalogItem),
      quantity: 1,
    });
    setPdpOpen(false);
  };

  // Build data for PDP panel
  const pdpBundleItem = pdpCartItem ? toBundleItem(pdpCartItem) : null;
  const pseudoBundle = toBundle(items);

  return (
    <div className="min-h-screen pt-14 bg-background">
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-10">
          <h1 className="mb-2">Your Cart</h1>
          <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-4 py-1.5">
            <FlaskConical className="size-3.5" />
            <span>This is a prototype checkout</span>
          </div>
        </div>

        {/* Items */}
        {items.length > 0 ? (
          <>
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {items.length} {items.length === 1 ? 'item' : 'items'} in your cart
                </p>
                <button
                  onClick={clearCart}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                >
                  Clear all
                </button>
              </div>

              <div className="divide-y divide-border">
                {items.map((item) => {
                  const catalogItem = findCatalogItem(item.id);
                  const imageSrc = catalogItem ? getProductImageSrc(catalogItem) : null;
                  const { displayName } = parseProductName(item.name);
                  return (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-muted/40 transition-colors"
                    onClick={() => handleProductClick(item)}
                  >
                    {/* Image */}
                    <div className="size-16 rounded-lg overflow-hidden bg-muted shrink-0">
                      {imageSrc ? (
                        <ImageWithFallback
                          src={imageSrc}
                          alt={displayName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {CATEGORY_LABELS[item.category] ?? item.category}
                        </Badge>
                      </div>
                      <p className="text-sm truncate" style={{ fontWeight: 500 }}>
                        {item.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{item.brand}</p>
                    </div>

                    {/* Quantity controls */}
                    <div
                      className="flex items-center gap-1.5 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="size-7 rounded-md border border-border flex items-center justify-center hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <Minus className="size-3" />
                      </button>
                      <span className="w-6 text-center text-sm tabular-nums" style={{ fontWeight: 500 }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="size-7 rounded-md border border-border flex items-center justify-center hover:bg-accent transition-colors"
                      >
                        <Plus className="size-3" />
                      </button>
                    </div>

                    {/* Price */}
                    <span className="text-base shrink-0 w-16 text-right" style={{ fontWeight: 600 }}>
                      ${(item.price * item.quantity).toFixed(0)}
                    </span>

                    {/* Remove */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeItem(item.id);
                      }}
                      className="shrink-0 size-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      aria-label={`Remove ${item.name}`}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  );
                })}
              </div>

              {/* Totals */}
              <div className="px-6 py-4 bg-muted/30 border-t border-border">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Original price</span>
                    <span className="line-through">${originalPrice.toFixed(0)}</span>
                  </div>
                  {savings > 0 && (
                    <div className="flex justify-between text-sm text-emerald-600">
                      <span className="flex items-center gap-1">
                        <Tag className="size-3.5" />
                        Bundle savings
                      </span>
                      <span>−${savings.toFixed(0)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between">
                    <span style={{ fontWeight: 600 }}>Total</span>
                    <span style={{ fontWeight: 700 }} className="text-lg">
                      ${totalPrice.toFixed(0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Prototype notice */}
            <div className="mt-6 rounded-xl bg-muted/50 border border-border px-6 py-4 text-sm text-muted-foreground">
              <p>
                <span style={{ fontWeight: 500 }}>Prototype note:</span> In a production app, this page would connect to a real checkout provider (Stripe, Shopify, etc.) to complete the purchase.
              </p>
            </div>

            {/* CTA */}
            <div className="mt-6 flex flex-col gap-3">
              <Button size="lg" className="w-full" disabled>
                Complete purchase (prototype)
              </Button>
              <Button variant="ghost" asChild className="gap-2">
                <Link to="/shop">
                  <ArrowLeft className="size-4" />
                  Back to shop
                </Link>
              </Button>
            </div>
          </>
        ) : (
          /* Empty state */
          <div className="rounded-2xl border border-border bg-card p-12 text-center">
            <p className="text-muted-foreground mb-4">Your cart is empty.</p>
            <Button variant="outline" asChild className="gap-2">
              <Link to="/shop">
                <ArrowLeft className="size-4" />
                Start shopping
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* Product Detail Panel — same sheet used on the shop page */}
      <ProductDetailPanel
        open={pdpOpen}
        bundleItem={pdpBundleItem}
        bundle={pseudoBundle}
        intentData={{}}
        defaultSize="M"
        onClose={() => setPdpOpen(false)}
        onReplace={handleReplace}
      />
    </div>
  );
}
