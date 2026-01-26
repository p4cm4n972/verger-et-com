'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useCart } from '@/lib/cart/CartContext';

export default function SuccessPage() {
  const { clearCart } = useCart();

  // Vider le panier à l'affichage de la page de succès
  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="pt-32 pb-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          {/* Icône de succès */}
          <div className="w-24 h-24 bg-fruit-green/20 rounded-full flex items-center justify-center mx-auto mb-8">
            <svg
              className="w-12 h-12 text-fruit-green"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h1 className="text-4xl font-bold text-white mb-4">
            Commande confirmée !
          </h1>

          <p className="text-xl text-foreground-muted mb-8">
            Merci pour votre commande. Vous recevrez un email de confirmation
            avec les détails de livraison.
          </p>

          {/* Détails */}
          <div className="bg-background-card rounded-2xl p-6 border border-border mb-8 text-left">
            <h2 className="font-bold text-white mb-4">Prochaines étapes</h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 bg-fruit-green/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-fruit-green text-sm">1</span>
                </span>
                <span className="text-foreground-muted">
                  Vous recevrez un email de confirmation sous quelques minutes
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 bg-fruit-orange/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-fruit-orange text-sm">2</span>
                </span>
                <span className="text-foreground-muted">
                  Notre équipe prépare votre commande avec des fruits frais de saison
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 bg-fruit-yellow/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-fruit-yellow text-sm">3</span>
                </span>
                <span className="text-foreground-muted">
                  Livraison le lundi ou mardi selon votre choix
                </span>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="px-8 py-3 bg-fruit-green text-background font-semibold rounded-full hover:bg-fruit-green/90 transition-all"
            >
              Retour à l'accueil
            </Link>
            <Link
              href="/paniers"
              className="px-8 py-3 border border-border text-white font-semibold rounded-full hover:bg-white/5 transition-all"
            >
              Commander à nouveau
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
