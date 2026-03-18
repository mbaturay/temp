import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '../../lib/cart-context';

export default function Root() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { itemCount } = useCart();
  const isHome = pathname === '/';
  const isShop = pathname === '/shop';

  return (
    <div className={`min-h-screen flex flex-col ${isShop ? '' : 'bg-background'}`}>
      {/* Nav */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-8 transition-colors duration-300 ${
          isHome
            ? 'bg-transparent'
            : isShop
              ? 'bg-black/70 backdrop-blur-xl border-b border-white/10'
              : 'bg-background/80 backdrop-blur-xl border-b border-border/50'
        }`}
      >
        <Link
          to="/"
          className={`flex items-center gap-2 tracking-tight ${
            isHome || isShop ? 'text-white' : 'text-foreground'
          }`}
        >
          <span
            className="text-xl"
            style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 500 }}
          >
            Adventure Outfitters
          </span>
        </Link>
        <button
          onClick={() => navigate('/checkout')}
          className={`relative px-5 py-2 rounded-full text-sm transition-all duration-200 flex items-center gap-2 ${
            isHome || isShop
              ? 'border border-white/30 text-white hover:bg-white/10 backdrop-blur-sm'
              : 'border border-border text-foreground hover:bg-accent'
          }`}
          style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 500 }}
        >
          <ShoppingBag className="size-4" />
          Cart ({itemCount})
        </button>
      </header>

      {/* Page content */}
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}
