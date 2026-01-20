import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { JUICES } from '@/lib/constants';

export default function JusPage() {
  // Grouper les jus par taille
  const juices25cl = JUICES.filter((j) => j.size === '25cl');
  const juices1L = JUICES.filter((j) => j.size === '1L');

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-fruit-orange/10 text-fruit-orange text-sm font-medium mb-6">
            <span>🍊</span>
            <span>100% pur jus</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Jus de Fruits
            <span className="block text-fruit-orange">Pressés & Naturels</span>
          </h1>
          <p className="text-xl text-foreground-muted max-w-2xl mx-auto">
            Des jus de fruits frais pour accompagner vos paniers.
            Disponibles en format individuel ou familial.
          </p>
        </div>
      </section>

      {/* Jus 25cl x 12 */}
      <section className="py-16 px-6 bg-background-card">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-fruit-orange/20 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🧃</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Format Individuel</h2>
              <p className="text-foreground-muted">25cl × 12 bouteilles</p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {juices25cl.map((juice) => (
              <div
                key={juice.id}
                className="p-6 rounded-2xl bg-background border border-border hover:border-fruit-orange/50 transition-all group"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-fruit-orange/20 to-fruit-yellow/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-4xl">🍊</span>
                </div>

                <h3 className="text-xl font-bold text-white mb-1">{juice.name}</h3>
                <p className="text-foreground-muted text-sm mb-4">
                  Pack de {juice.quantity} bouteilles de {juice.size}
                </p>

                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-3xl font-bold text-fruit-orange">{juice.price}€</span>
                  <span className="text-foreground-muted text-sm">
                    soit {(juice.price / juice.quantity).toFixed(2)}€/bouteille
                  </span>
                </div>

                <button className="w-full py-3 rounded-xl font-semibold border border-fruit-orange text-fruit-orange hover:bg-fruit-orange hover:text-background transition-all">
                  Ajouter au panier
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Jus 1L x 6 */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-fruit-yellow/20 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🍹</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Format Familial</h2>
              <p className="text-foreground-muted">1L × 6 bouteilles</p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {juices1L.map((juice) => (
              <div
                key={juice.id}
                className="p-6 rounded-2xl bg-background-card border border-border hover:border-fruit-yellow/50 transition-all group"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-fruit-yellow/20 to-fruit-orange/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-4xl">🍹</span>
                </div>

                <h3 className="text-xl font-bold text-white mb-1">{juice.name}</h3>
                <p className="text-foreground-muted text-sm mb-4">
                  Pack de {juice.quantity} bouteilles de {juice.size}
                </p>

                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-3xl font-bold text-fruit-yellow">{juice.price}€</span>
                  <span className="text-foreground-muted text-sm">
                    soit {(juice.price / juice.quantity).toFixed(2)}€/bouteille
                  </span>
                </div>

                <button className="w-full py-3 rounded-xl font-semibold border border-fruit-yellow text-fruit-yellow hover:bg-fruit-yellow hover:text-background transition-all">
                  Ajouter au panier
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 bg-background-card">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Combinez avec un panier de fruits
          </h2>
          <p className="text-foreground-muted mb-8">
            Profitez de nos offres combinées panier + jus pour vos équipes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/paniers"
              className="px-8 py-3 bg-fruit-green text-background font-semibold rounded-full hover:bg-fruit-green/90 transition-all"
            >
              Voir les paniers
            </a>
            <a
              href="/commander"
              className="px-8 py-3 border border-border text-white font-semibold rounded-full hover:bg-background transition-colors"
            >
              Commander directement
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
