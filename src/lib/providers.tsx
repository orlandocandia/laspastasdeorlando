'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { initImagePerformanceMonitor, cleanupImagePerformanceMonitor } from '@/lib/performance'

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  // Initialize image performance monitor in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      initImagePerformanceMonitor()
      return () => cleanupImagePerformanceMonitor()
    }
  }, [])

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </SessionProvider>
  )
}
