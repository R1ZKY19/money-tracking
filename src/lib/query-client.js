import { QueryClient } from '@tanstack/react-query';

export const queryClientInstance = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,   // Re-fetch saat koneksi pulih
      refetchOnMount: false,
      retry: 2,                   // Coba 2x sebelum error
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
      staleTime: 1000 * 60 * 2,  // 2 menit — lebih fresh untuk financial data
      gcTime: 1000 * 60 * 10,
    },
    mutations: {
      retry: 1,
    }
  },
});