import { createBrowserRouter } from 'react-router';
import Root from './components/layout/Root';
import Home from './pages/Home';
import Shop from './pages/Shop';
import Checkout from './pages/Checkout';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: 'shop', Component: Shop },
      { path: 'checkout', Component: Checkout },
    ],
  },
]);
