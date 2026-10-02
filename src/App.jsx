import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Layout from './components/Layout'
import CataloguePage from './pages/CataloguePage'
import ProductPage from './pages/ProductPage'
import CartPage from './pages/CartPage'
import NotFoundPage from './pages/NotFoundPage'
import CheckoutPage from './pages/CheckoutPage'
import OrderConfirmationPage from './pages/OrderConfirmationPage'
import RequestState from './components/RequestState'
import { useLanguage } from './hooks/useLanguage'

function RouteLoading() {
  const { t } = useLanguage()
  return <RequestState mainHeading loading title={t('Loading products …')} />
}

// Keep administration code out of the initial storefront download.
const lazyPage = (load) => async () => ({ Component: (await load()).default })

// Child routes share the header, storage notices and footer through Layout.
const router = createBrowserRouter(
  [
    {
      element: <Layout />,
      HydrateFallback: RouteLoading,
      children: [
        // Storefront routes share the outer layout.
        { path: '/', element: <CataloguePage /> },
        { path: '/products/:id', element: <ProductPage /> },
        { path: '/cart', element: <CartPage /> },
        { path: '/checkout', element: <CheckoutPage /> },
        { path: '/orders/:id', element: <OrderConfirmationPage /> },
        {
          path: '/admin',
          lazy: lazyPage(() => import('./pages/AdminLayout')),
          // Relative admin routes render inside AdminLayout's outlet.
          children: [
            {
              index: true,
              lazy: lazyPage(() => import('./pages/AdminDashboardPage')),
            },
            {
              path: 'products',
              lazy: lazyPage(() => import('./pages/AdminProductsPage')),
            },
            {
              path: 'content',
              lazy: lazyPage(() => import('./pages/AdminContentPage')),
            },
            {
              path: 'orders',
              lazy: lazyPage(() => import('./pages/AdminOrdersPage')),
            },
            {
              path: 'orders/:id',
              lazy: lazyPage(() => import('./pages/AdminOrdersPage')),
            },
          ],
        },
        { path: '*', element: <NotFoundPage /> },
      ],
    },
  ],
  { basename: import.meta.env.BASE_URL },
)

export default function App() {
  return <RouterProvider router={router} />
}
