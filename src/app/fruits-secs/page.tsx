import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { DRIED_FRUITS } from '@/lib/constants';

export default function FruitsSecsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-fruit-yellow/10 text-fruit-yellow text-sm font-medium mb-6">
            <span>🥜</span>
            <span>Snack sain</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Fruits Secs
            <span className="block text-fruit-yellow">& Mélanges Énergétiques</span>
          </h1>
          <p className="text-xl text-foreground-muted max-w-2xl mx-auto">
            Des mélanges de fruits secs et oléagineux pour une pause gourmande et énergétique au bureau.
          </p>
        </div>
      </section>

      {/* Produits */}
      <section className="py-16 px-6 bg-background-card">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-fruit-yellow/20 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🥜</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Nos Mélanges</h2>
              <p className="text-foreground-muted">600g - Pour 10 personnes</p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {DRIED_FRUITS.map((dried, index) => {
              const emojis = ['⚡', '🍫', '🌴'];
              const colors = ['fruit-red', 'fruit-orange', 'fruit-green'];
              const descriptions = [
                'Amandes, noix de cajou, raisins secs, cranberries. Le boost idéal pour vos équipes.',
                'Noisettes, chocolat noir, abricots secs, noix. Pour les gourmands.',
                'Noix de coco, mangue séchée, ananas, macadamia. Évasion garantie.',
              ];

              return (
                <div
                  key={dried.id}
                  className={`p-6 rounded-2xl bg-background border-2 border-${colors[index]} hover:shadow-lg hover:shadow-${colors[index]}/20 transition-all group`}
                >
                  <div className={`w-20 h-20 bg-${colors[index]}/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <span className="text-4xl">{emojis[index]}</span>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2">{dried.name}</h3>
                  <p className="text-foreground-muted text-sm mb-4">
                    {descriptions[index]}
                  </p>

                  <div className="flex items-center gap-4 mb-4 text-sm text-foreground-muted">
                    <span className="flex items-center gap-1">
                      <span className={`text-${colors[index]}`}>⚖️</span>
                      {dried.weight}g
                    </span>
                    <span className="flex items-center gap-1">
                      <span className={`text-${colors[index]}`}>👥</span>
                      {dried.persons} pers.
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2 mb-4">
                    <span className={`text-3xl font-bold text-${colors[index]}`}>{dried.price}€</span>
                    <span className="text-foreground-muted text-sm">/ sachet</span>
                  </div>

                  <button className={`w-full py-3 rounded-xl font-semibold border border-${colors[index]} text-${colors[index]} hover:bg-${colors[index]} hover:text-background transition-all`}>
                    Ajouter au panier
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Avantages */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-12">
            Pourquoi des fruits secs au bureau ?
          </h2>

          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-fruit-red/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">⚡</span>
              </div>
              <h3 className="font-bold text-white mb-2">Énergie durable</h3>
              <p className="text-foreground-muted text-sm">
                Glucides lents pour une énergie stable toute la journée
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-fruit-orange/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🧠</span>
              </div>
              <h3 className="font-bold text-white mb-2">Concentration</h3>
              <p className="text-foreground-muted text-sm">
                Oméga-3 et vitamines pour booster la concentration
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-fruit-yellow/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🏃</span>
              </div>
              <h3 className="font-bold text-white mb-2">Pratique</h3>
              <p className="text-foreground-muted text-sm">
                Se conserve longtemps, facile à partager
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-fruit-green/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🌱</span>
              </div>
              <h3 className="font-bold text-white mb-2">Naturel</h3>
              <p className="text-foreground-muted text-sm">
                Sans additifs, sans sucres ajoutés
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 bg-background-card">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Complétez votre commande
          </h2>
          <p className="text-foreground-muted mb-8">
            Ajoutez des fruits frais et des jus pour une pause complète.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/paniers"
              className="px-8 py-3 bg-fruit-green text-background font-semibold rounded-full hover:bg-fruit-green/90 transition-all"
            >
              Voir les paniers
            </a>
            <a
              href="/jus"
              className="px-8 py-3 border border-fruit-orange text-fruit-orange font-semibold rounded-full hover:bg-fruit-orange hover:text-background transition-all"
            >
              Voir les jus
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
