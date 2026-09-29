import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Layout from './components/Layout'
import CataloguePage from './pages/CataloguePage'
import ProductPage from './pages/ProductPage'
import CartPage from './pages/CartPage'
import NotFoundPage from './pages/NotFoundPage'
import CheckoutPage from './pages/CheckoutPage'
import OrderConfirmationPage from './pages/OrderConfirmationPage'
import AdminOrdersPage from './pages/AdminOrdersPage'

// Child routes share the header, storage notices and footer through Layout.
const router = createBrowserRouter(
  [
    {
      element: <Layout />,
      children: [
        { path: '/', element: <CataloguePage /> },
        { path: '/products/:id', element: <ProductPage /> },
        { path: '/cart', element: <CartPage /> },
        { path: '/checkout', element: <CheckoutPage /> },
        { path: '/orders/:id', element: <OrderConfirmationPage /> },
        { path: '/admin/orders', element: <AdminOrdersPage /> },
        { path: '/admin/orders/:id', element: <AdminOrdersPage /> },
        { path: '*', element: <NotFoundPage /> },
      ],
    },
  ],
  { basename: import.meta.env.BASE_URL },
)

export default function App() {
  return <RouterProvider router={router} />
}
