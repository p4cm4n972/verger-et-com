'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// Routes critiques à préfetcher dès le chargement
const CRITICAL_ROUTES = [
  '/commander',
  '/paniers',
  '/paniers/composer',
];

export function usePrefetchRoutes() {
  const router = useRouter();

  useEffect(() => {
    // Préfetcher les routes critiques après l'hydratation
    CRITICAL_ROUTES.forEach((route) => {
      router.prefetch(route);
    });
  }, [router]);
}
