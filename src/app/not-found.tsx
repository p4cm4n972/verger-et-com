import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center px-6">
        <div className="text-center">
          <span className="text-8xl mb-6 block">🍋</span>
          <h1 className="text-6xl font-bold text-white mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-fruit-yellow mb-4">
            Page introuvable
          </h2>
          <p className="text-foreground-muted mb-8 max-w-md mx-auto">
            Oups ! Cette page semble avoir roulé hors du panier.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="px-6 py-3 bg-gradient-to-r from-fruit-green to-fruit-green/80 text-background font-semibold rounded-full hover:opacity-90 transition-all"
            >
              Retour à l&apos;accueil
            </Link>
            <Link
              href="/paniers"
              className="px-6 py-3 border-2 border-fruit-orange/50 text-white font-semibold rounded-full hover:bg-fruit-orange/10 hover:border-fruit-orange transition-colors"
            >
              Voir les paniers
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
