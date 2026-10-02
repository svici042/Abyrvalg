import { AdminProvider } from './context/AdminProvider'
import { CurrencyProvider } from './context/CurrencyProvider'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CartProvider } from './context/CartProvider'
import { ThemeProvider } from './context/ThemeProvider'
import { LanguageProvider } from './context/LanguageProvider'
import { OrderProvider } from './context/OrderProvider'
import { RecentProvider } from './context/RecentProvider'

// One shared cache avoids duplicate product requests across routes.
const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60000, retry: 1 } },
})

// Mount shared providers above the router so their state survives page navigation.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AdminProvider>
        <ThemeProvider>
          <CartProvider>
            <CurrencyProvider>
              <LanguageProvider>
                <OrderProvider>
                  <RecentProvider>
                    <App />
                  </RecentProvider>
                </OrderProvider>
              </LanguageProvider>
            </CurrencyProvider>
          </CartProvider>
        </ThemeProvider>
      </AdminProvider>
    </QueryClientProvider>
  </StrictMode>,
)
