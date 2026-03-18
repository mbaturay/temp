import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export interface CartItem {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice: number;
  image: string;
  category: string;
  rationale: string;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  totalPrice: number;
  originalPrice: number;
  savings: number;
  itemCount: number;
  addItems: (items: CartItem[]) => void;
  removeItem: (id: string) => void;
  replaceItem: (oldId: string, newItem: CartItem) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItems = useCallback((newItems: CartItem[]) => {
    setItems((prev) => {
      const merged = [...prev];
      for (const item of newItems) {
        const existing = merged.find((i) => i.id === item.id);
        if (existing) {
          existing.quantity += item.quantity;
        } else {
          merged.push({ ...item });
        }
      }
      return merged;
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const replaceItem = useCallback((oldId: string, newItem: CartItem) => {
    setItems((prev) => prev.map((i) => (i.id === oldId ? { ...newItem } : i)));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity < 1) return;
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity } : i)));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalPrice = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const originalPrice = items.reduce((s, i) => s + i.originalPrice * i.quantity, 0);
  const savings = originalPrice - totalPrice;
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, totalPrice, originalPrice, savings, itemCount, addItems, removeItem, replaceItem, updateQuantity, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
