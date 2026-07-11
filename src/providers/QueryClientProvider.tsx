"use client"

import {
  QueryClient,
  QueryClientProvider as TanStackQueryClientProvider,
} from '@tanstack/react-query'
import { useState } from 'react'

/**
 * Provider pour React Query
 * Fait partie de ST-309: Optimiser les Performances Frontend
 * 
 * Ce provider enveloppe l'application avec un QueryClient configuré
 * pour le caching des requêtes API.
 */
export function QueryClientProvider({ children }: { children: React.ReactNode }) {
  // Créer un QueryClient avec les options par défaut
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Temps pendant lequel les données sont considérées comme fraîches
            staleTime: 5 * 60 * 1000, // 5 minutes
            // Temps pendant lequel les données sont gardées en cache
            gcTime: 10 * 60 * 1000, // 10 minutes
            // Nombre de tentatives de retry
            retry: 1,
            // Désactiver le refetch automatique sur la reconnexion
            refetchOnReconnect: false,
            // Désactiver le refetch automatique sur le focus de la fenêtre
            refetchOnWindowFocus: false,
            // Désactiver le refetch automatique en arrière-plan
            refetchOnMount: false,
          },
          mutations: {
            // Nombre de tentatives de retry pour les mutations
            retry: 0,
          },
        },
      })
  )

  return (
    <TanStackQueryClientProvider client={queryClient}>
      {children}
    </TanStackQueryClientProvider>
  )
}

export default QueryClientProvider
