import { RouterProvider } from 'react-router';
import { router } from './routes';
import { CartProvider } from './lib/cart-context';
import { ShopSessionProvider } from './lib/shop-session-context';

export default function App() {
  return (
    <CartProvider>
      <ShopSessionProvider>
        <RouterProvider router={router} />
      </ShopSessionProvider>
    </CartProvider>
  );
}
