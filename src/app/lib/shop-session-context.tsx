import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { IntentData, Bundle } from '../../lib/ai';

type View = 'onboarding' | 'building' | 'results';

interface ShopSession {
  view: View;
  intentData: IntentData | null;
  bundle: Bundle | null;
  cartAdded: boolean;
}

interface ShopSessionContextValue extends ShopSession {
  setView: (v: View) => void;
  setIntentData: (d: IntentData | null) => void;
  setBundle: (b: Bundle | null) => void;
  setCartAdded: (v: boolean) => void;
  resetSession: () => void;
}

const initial: ShopSession = {
  view: 'onboarding',
  intentData: null,
  bundle: null,
  cartAdded: false,
};

const ShopSessionContext = createContext<ShopSessionContextValue | null>(null);

export function ShopSessionProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<View>(initial.view);
  const [intentData, setIntentData] = useState<IntentData | null>(initial.intentData);
  const [bundle, setBundle] = useState<Bundle | null>(initial.bundle);
  const [cartAdded, setCartAdded] = useState(initial.cartAdded);

  const resetSession = useCallback(() => {
    setView('onboarding');
    setIntentData(null);
    setBundle(null);
    setCartAdded(false);
  }, []);

  return (
    <ShopSessionContext.Provider
      value={{ view, intentData, bundle, cartAdded, setView, setIntentData, setBundle, setCartAdded, resetSession }}
    >
      {children}
    </ShopSessionContext.Provider>
  );
}

export function useShopSession() {
  const ctx = useContext(ShopSessionContext);
  if (!ctx) throw new Error('useShopSession must be used within ShopSessionProvider');
  return ctx;
}
