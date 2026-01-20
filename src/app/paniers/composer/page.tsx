import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { BasketComposer } from '@/components/basket';

export default function ComposerPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-12 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-fruit-green/10 text-fruit-green text-sm font-medium mb-6">
            <span>🎨</span>
            <span>Composition personnalisée</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Composez votre
            <span className="block bg-gradient-to-r from-fruit-red via-fruit-orange to-fruit-yellow bg-clip-text text-transparent">
              panier sur-mesure
            </span>
          </h1>
          <p className="text-xl text-foreground-muted max-w-2xl mx-auto">
            Glissez-déposez vos fruits préférés pour créer le panier idéal.
            Le prix s'ajuste automatiquement.
          </p>
        </div>
      </section>

      {/* Composer */}
      <section className="pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <BasketComposer />
        </div>
      </section>

      {/* Tips */}
      <section className="py-12 px-6 bg-background-card border-t border-border">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-lg font-bold text-white mb-6 text-center">Comment ça marche ?</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-fruit-red/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">1️⃣</span>
              </div>
              <h3 className="font-medium text-white mb-1">Choisissez la taille</h3>
              <p className="text-sm text-foreground-muted">5kg, 8kg ou 12kg selon la taille de votre équipe</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-fruit-orange/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">2️⃣</span>
              </div>
              <h3 className="font-medium text-white mb-1">Glissez les fruits</h3>
              <p className="text-sm text-foreground-muted">Faites glisser vos fruits préférés dans le panier</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-fruit-yellow/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">3️⃣</span>
              </div>
              <h3 className="font-medium text-white mb-1">Ajustez les quantités</h3>
              <p className="text-sm text-foreground-muted">Utilisez +/- pour ajuster le poids de chaque fruit</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-fruit-green/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">4️⃣</span>
              </div>
              <h3 className="font-medium text-white mb-1">Validez votre panier</h3>
              <p className="text-sm text-foreground-muted">Une fois le poids atteint, ajoutez au panier</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
