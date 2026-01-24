import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Logo } from '@/components/ui/Logo';
import { FloatingFruits, FruitStrip, AppleIcon, OrangeIcon, BananaIcon, GrapesIcon, StrawberryIcon } from '@/components/ui/FruitIcons';
import { BASKET_SIZES, JUICES, DRIED_FRUITS } from '@/lib/constants';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero avec fruits flottants */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Background gradient coloré */}
        <div className="absolute inset-0 bg-gradient-to-br from-fruit-red/5 via-fruit-orange/5 to-fruit-green/5" />

        {/* Fruits flottants */}
        <FloatingFruits className="opacity-30" />

        <div className="relative max-w-7xl mx-auto text-center">
          <div className="flex justify-center mb-8">
            <Logo size="xl" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Des fruits frais livrés
            <br />
            <span className="bg-gradient-to-r from-fruit-red via-fruit-orange to-fruit-yellow bg-clip-text text-transparent">
              dans votre entreprise
            </span>
          </h1>
          <p className="text-xl text-foreground-muted max-w-2xl mx-auto mb-10">
            Paniers de saison, jus de fruits et fruits secs.
            <br />
            Composez votre panier ou choisissez nos sélections.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/paniers/composer"
              className="px-8 py-4 bg-gradient-to-r from-fruit-green to-fruit-green/80 text-background font-semibold rounded-full text-lg hover:opacity-90 transition-all hover:scale-105 shadow-lg shadow-fruit-green/20"
            >
              Composer mon panier
            </Link>
            <Link
              href="#paniers"
              className="px-8 py-4 border-2 border-fruit-orange/50 text-white font-semibold rounded-full text-lg hover:bg-fruit-orange/10 hover:border-fruit-orange transition-colors"
            >
              Voir les offres
            </Link>
          </div>

          {/* Bande de fruits */}
          <div className="mt-16 opacity-60">
            <FruitStrip />
          </div>
        </div>
      </section>

      {/* Paniers */}
      <section id="paniers" className="py-20 px-6 bg-gradient-to-b from-background-card to-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-fruit-green/10 text-fruit-green text-sm font-medium mb-4">
              <span>🧺</span>
              <span>Fruits de saison</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Nos Paniers de Fruits Frais
            </h2>
            <p className="text-foreground-muted max-w-xl mx-auto">
              Fruits de saison sélectionnés avec soin. Livraison hebdomadaire ou ponctuelle.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {BASKET_SIZES.map((basket, index) => {
              const gradients = [
                'from-fruit-red/20 to-fruit-red/5',
                'from-fruit-orange/20 to-fruit-orange/5',
                'from-fruit-green/20 to-fruit-green/5',
              ];
              const borderColors = ['border-fruit-red', 'border-fruit-orange', 'border-fruit-green'];
              const textColors = ['text-fruit-red', 'text-fruit-orange', 'text-fruit-green'];
              const bgColors = ['bg-fruit-red/20', 'bg-fruit-orange/20', 'bg-fruit-green/20'];

              return (
                <div
                  key={basket.id}
                  className={`relative p-6 rounded-2xl bg-gradient-to-br ${gradients[index]} border-2 ${borderColors[index]} transition-all hover:scale-[1.02] hover:shadow-xl`}
                >
                  {index === 1 && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-fruit-orange to-fruit-yellow text-background text-sm font-semibold rounded-full">
                      Populaire
                    </div>
                  )}

                  <div className={`w-16 h-16 ${bgColors[index]} rounded-2xl flex items-center justify-center mb-4`}>
                    <span className="text-3xl">🧺</span>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2">{basket.name}</h3>
                  <p className="text-foreground-muted text-sm mb-4">{basket.description}</p>

                  <div className="flex items-baseline gap-2 mb-4">
                    <span className={`text-4xl font-bold ${textColors[index]}`}>{basket.price}€</span>
                    <span className="text-foreground-muted">/ livraison</span>
                  </div>

                  <ul className="space-y-2 mb-6">
                    <li className="flex items-center gap-2 text-foreground-muted">
                      <span className={textColors[index]}>✓</span>
                      {basket.weight}kg de fruits frais
                    </li>
                    <li className="flex items-center gap-2 text-foreground-muted">
                      <span className={textColors[index]}>✓</span>
                      Pour {basket.persons} personnes
                    </li>
                    <li className="flex items-center gap-2 text-foreground-muted">
                      <span className={textColors[index]}>✓</span>
                      Fruits de saison
                    </li>
                  </ul>

                  <Link
                    href="/paniers"
                    className={`block w-full py-3 rounded-xl font-semibold text-center transition-all ${
                      index === 1
                        ? 'bg-gradient-to-r from-fruit-orange to-fruit-yellow text-background hover:opacity-90'
                        : `border-2 ${borderColors[index]} ${textColors[index]} hover:bg-white/5`
                    }`}
                  >
                    Choisir ce panier
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Option personnalisation */}
          <div className="mt-12 p-8 rounded-2xl bg-gradient-to-r from-fruit-green/30 via-fruit-yellow/20 to-fruit-orange/30 border border-fruit-green/50 text-center relative overflow-hidden">
            <div className="absolute -right-10 -top-10 opacity-20">
              <BananaIcon size={150} />
            </div>
            <div className="absolute -left-10 -bottom-10 opacity-20">
              <StrawberryIcon size={120} />
            </div>
            <div className="relative">
              <h3 className="text-2xl font-bold text-white mb-3">
                Envie de composer votre propre panier ?
              </h3>
              <p className="text-foreground-muted mb-6">
                Glissez-déposez vos fruits préférés et créez le panier idéal pour votre équipe.
              </p>
              <Link
                href="/paniers/composer"
                className="inline-block px-8 py-3 bg-gradient-to-r from-fruit-green to-fruit-green/80 text-background font-semibold rounded-full hover:opacity-90 transition-all shadow-lg shadow-fruit-green/20"
              >
                Personnaliser mon panier
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Jus de fruits */}
      <section id="jus" className="py-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-fruit-orange/5 to-fruit-yellow/5" />

        <div className="relative max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-fruit-orange/10 text-fruit-orange text-sm font-medium mb-4">
                <span>🍊</span>
                <span>100% pur jus</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Jus de Fruits
              </h2>
              <p className="text-foreground-muted max-w-xl">
                Pressés et naturels. En format individuel ou familial.
              </p>
            </div>
            <Link
              href="/jus"
              className="mt-4 md:mt-0 text-fruit-orange hover:underline font-medium flex items-center gap-2"
            >
              Voir tous les jus
              <span>→</span>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {JUICES.slice(0, 3).map((juice, index) => {
              // Icônes et couleurs selon le type de jus
              const juiceData = [
                { icon: <OrangeIcon size={40} />, color: 'fruit-orange', gradient: 'from-fruit-orange/20 to-fruit-orange/5' },
                { icon: <AppleIcon size={40} />, color: 'fruit-red', gradient: 'from-fruit-red/20 to-fruit-red/5' },
                { icon: <GrapesIcon size={40} />, color: 'fruit-yellow', gradient: 'from-fruit-yellow/20 to-fruit-yellow/5' },
              ];
              const { icon, color, gradient } = juiceData[index];

              return (
                <div
                  key={juice.id}
                  className={`p-6 rounded-2xl bg-gradient-to-br ${gradient} border border-${color}/30 hover:border-${color} transition-all group`}
                >
                  <div className={`w-16 h-16 bg-${color}/30 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    {icon}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">{juice.name}</h3>
                  <p className="text-foreground-muted text-sm mb-3">
                    {juice.quantity} × {juice.size}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-2xl font-bold text-${color}`}>{juice.price}€</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Fruits secs */}
      <section id="fruits-secs" className="py-20 px-6 bg-gradient-to-b from-background to-background-card">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-fruit-yellow/10 text-fruit-yellow text-sm font-medium mb-4">
                <span>🥜</span>
                <span>Snack sain</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Fruits Secs
              </h2>
              <p className="text-foreground-muted max-w-xl">
                Mélanges énergétiques pour une pause gourmande au bureau.
              </p>
            </div>
            <Link
              href="/fruits-secs"
              className="mt-4 md:mt-0 text-fruit-yellow hover:underline font-medium flex items-center gap-2"
            >
              Voir tous les mélanges
              <span>→</span>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {DRIED_FRUITS.map((dried, index) => {
              const emojis = ['⚡', '🍫', '🌴'];
              const colors = ['fruit-red', 'fruit-orange', 'fruit-green'];
              const gradients = [
                'from-fruit-red/20 to-fruit-red/5',
                'from-fruit-orange/20 to-fruit-orange/5',
                'from-fruit-green/20 to-fruit-green/5',
              ];

              return (
                <div
                  key={dried.id}
                  className={`p-6 rounded-2xl bg-gradient-to-br ${gradients[index]} border border-${colors[index]}/30 hover:border-${colors[index]} transition-all`}
                >
                  <div className={`w-16 h-16 bg-${colors[index]}/30 rounded-2xl flex items-center justify-center mb-4`}>
                    <span className="text-3xl">{emojis[index]}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">{dried.name}</h3>
                  <p className="text-foreground-muted text-sm mb-3">
                    {dried.weight}g • {dried.persons} personnes
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-2xl font-bold text-${colors[index]}`}>{dried.price}€</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats avec couleurs */}
      <section className="py-16 px-6 bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-fruit-red/5 via-fruit-yellow/5 to-fruit-green/5" />

        <div className="relative max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div className="p-6 rounded-2xl bg-fruit-red/10 border border-fruit-red/20">
            <div className="text-4xl font-bold text-fruit-red mb-2">150+</div>
            <div className="text-foreground-muted">Entreprises clientes</div>
          </div>
          <div className="p-6 rounded-2xl bg-fruit-orange/10 border border-fruit-orange/20">
            <div className="text-4xl font-bold text-fruit-orange mb-2">2000+</div>
            <div className="text-foreground-muted">Paniers livrés/mois</div>
          </div>
          <div className="p-6 rounded-2xl bg-fruit-yellow/10 border border-fruit-yellow/20">
            <div className="text-4xl font-bold text-fruit-yellow mb-2">98%</div>
            <div className="text-foreground-muted">Satisfaction client</div>
          </div>
          <div className="p-6 rounded-2xl bg-fruit-green/10 border border-fruit-green/20">
            <div className="text-4xl font-bold text-fruit-green mb-2">Lun/Mar</div>
            <div className="text-foreground-muted">Livraison hebdo</div>
          </div>
        </div>
      </section>

      {/* CTA Final avec gradient coloré */}
      <section className="py-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-fruit-green/20 via-fruit-yellow/20 to-fruit-orange/20" />
        <div className="absolute -left-20 top-1/2 -translate-y-1/2 opacity-20">
          <AppleIcon size={200} />
        </div>
        <div className="absolute -right-20 top-1/2 -translate-y-1/2 opacity-20">
          <OrangeIcon size={200} />
        </div>

        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Prêt à offrir des{' '}
            <span className="bg-gradient-to-r from-fruit-red via-fruit-orange to-fruit-yellow bg-clip-text text-transparent">
              fruits frais
            </span>{' '}
            à vos équipes ?
          </h2>
          <p className="text-foreground-muted text-lg mb-8">
            Commandez dès maintenant ou contactez-nous pour un devis personnalisé.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/commander"
              className="px-8 py-4 bg-gradient-to-r from-fruit-green to-fruit-green/80 text-background font-semibold rounded-full text-lg hover:opacity-90 transition-all hover:scale-105 shadow-lg shadow-fruit-green/30"
            >
              Commander maintenant
            </Link>
            <Link
              href="/contact"
              className="px-8 py-4 border-2 border-white/20 text-white font-semibold rounded-full text-lg hover:bg-white/5 transition-colors"
            >
              Demander un devis
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
