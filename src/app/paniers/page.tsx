import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { BasketCard } from '@/components/BasketCard';
import { BASKET_SIZES, FRUITS } from '@/lib/constants';

export default function PaniersPage() {
  // Fruits de saison (janvier)
  const currentMonth = new Date().getMonth() + 1;
  const seasonalFruits = FRUITS.filter((f) => f.season.includes(currentMonth));

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-fruit-green/10 text-fruit-green text-sm font-medium mb-6">
            <span>🧺</span>
            <span>Fruits de saison</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Paniers de Fruits
            <span className="block text-fruit-green">Frais & de Saison</span>
          </h1>
          <p className="text-xl text-foreground-muted max-w-2xl mx-auto">
            Choisissez parmi nos paniers composés ou créez le vôtre
            en glissant-déposant vos fruits préférés.
          </p>
        </div>
      </section>

      {/* Paniers prédéfinis */}
      <section className="py-16 px-6 bg-background-card">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-2">Paniers Composés</h2>
          <p className="text-foreground-muted mb-8">
            Nos sélections de fruits de saison, prêtes à être livrées.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {BASKET_SIZES.map((basket, index) => {
              const colors = ['fruit-red', 'fruit-orange', 'fruit-green'];
              return (
                <BasketCard
                  key={basket.id}
                  basket={basket}
                  colorClass={colors[index]}
                  isPopular={index === 1}
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* Composer son panier */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="p-8 rounded-2xl bg-gradient-to-r from-fruit-green/20 via-fruit-yellow/10 to-fruit-orange/20 border border-fruit-green/30">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-3">
                  Composez votre panier personnalisé
                </h2>
                <p className="text-foreground-muted mb-6">
                  Choisissez la taille de votre panier puis glissez-déposez les fruits
                  que vous souhaitez. Notre algorithme ajuste le prix automatiquement.
                </p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2 text-foreground-muted">
                    <span className="text-fruit-green">✓</span>
                    Choisissez parmi {FRUITS.length} fruits disponibles
                  </li>
                  <li className="flex items-center gap-2 text-foreground-muted">
                    <span className="text-fruit-green">✓</span>
                    Prix calculé en temps réel
                  </li>
                  <li className="flex items-center gap-2 text-foreground-muted">
                    <span className="text-fruit-green">✓</span>
                    Sauvegardez vos compositions favorites
                  </li>
                </ul>
                <a
                  href="/paniers/composer"
                  className="inline-block px-8 py-3 bg-fruit-green text-background font-semibold rounded-full hover:bg-fruit-green/90 transition-all"
                >
                  Commencer la composition
                </a>
              </div>

              {/* Preview fruits */}
              <div className="flex-1 grid grid-cols-4 gap-3">
                {seasonalFruits.slice(0, 8).map((fruit) => (
                  <div
                    key={fruit.id}
                    className="w-16 h-16 bg-background rounded-xl flex items-center justify-center text-2xl hover:scale-110 transition-transform cursor-pointer"
                    title={fruit.name}
                  >
                    {fruit.emoji}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Fruits de saison */}
      <section className="py-16 px-6 bg-background-card">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-2">Fruits de Saison</h2>
          <p className="text-foreground-muted mb-8">
            Disponibles ce mois-ci dans nos paniers.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-4">
            {seasonalFruits.map((fruit) => (
              <div
                key={fruit.id}
                className={`p-4 rounded-xl bg-background border border-border hover:border-${fruit.category === 'red' ? 'fruit-red' : fruit.category === 'orange' ? 'fruit-orange' : fruit.category === 'yellow' ? 'fruit-yellow' : 'fruit-green'}/50 transition-all text-center group cursor-pointer`}
              >
                <div className="text-3xl mb-2 group-hover:scale-125 transition-transform">
                  {fruit.emoji}
                </div>
                <div className="text-sm text-white font-medium">{fruit.name}</div>
                <div className="text-xs text-foreground-muted">{fruit.pricePerKg}€/kg</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Abonnement */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="p-8 rounded-2xl bg-background-card border border-border text-center">
            <div className="w-16 h-16 bg-fruit-orange/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">🔄</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">
              Passez à l'abonnement hebdomadaire
            </h2>
            <p className="text-foreground-muted mb-6 max-w-xl mx-auto">
              Recevez automatiquement vos paniers chaque semaine.
              Modifiez ou pausez à tout moment, sans engagement.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <div className="px-6 py-3 bg-background rounded-xl border border-border">
                <div className="text-fruit-green font-bold text-lg">-10%</div>
                <div className="text-foreground-muted text-sm">sur chaque livraison</div>
              </div>
              <div className="px-6 py-3 bg-background rounded-xl border border-border">
                <div className="text-fruit-orange font-bold text-lg">Livraison</div>
                <div className="text-foreground-muted text-sm">toujours offerte</div>
              </div>
              <div className="px-6 py-3 bg-background rounded-xl border border-border">
                <div className="text-fruit-yellow font-bold text-lg">Sans</div>
                <div className="text-foreground-muted text-sm">engagement</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
