import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import { AppRoutes } from './routes/AppRoutes'
import { AdvisorSessionProvider } from './features/advisor/context/AdvisorSessionContext'

const router = createBrowserRouter(AppRoutes)
const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AdvisorSessionProvider>
        <RouterProvider router={router} />
      </AdvisorSessionProvider>
    </QueryClientProvider>
  </StrictMode>
)
