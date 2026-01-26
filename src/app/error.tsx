'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Erreur application:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="text-center">
        <span className="text-8xl mb-6 block">🍅</span>
        <h1 className="text-4xl font-bold text-white mb-4">
          Quelque chose s&apos;est mal passé
        </h1>
        <p className="text-foreground-muted mb-8 max-w-md mx-auto">
          Une erreur inattendue s&apos;est produite. Nos fruits sont confus.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 bg-gradient-to-r from-fruit-green to-fruit-green/80 text-background font-semibold rounded-full hover:opacity-90 transition-all"
          >
            Réessayer
          </button>
          <Link
            href="/"
            className="px-6 py-3 border-2 border-fruit-orange/50 text-white font-semibold rounded-full hover:bg-fruit-orange/10 hover:border-fruit-orange transition-colors"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
        {error.digest && (
          <p className="text-xs text-foreground-muted mt-8">
            Code erreur: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
