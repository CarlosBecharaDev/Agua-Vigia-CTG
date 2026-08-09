import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 10 * 60_000,
      retry: (intentos, error) => {
        const estado = (error as { response?: { status?: number } })?.response?.status
        return intentos < 2 && (!estado || estado >= 500)
      },
      refetchOnWindowFocus: false,
    },
    mutations: { retry: false },
  },
})
