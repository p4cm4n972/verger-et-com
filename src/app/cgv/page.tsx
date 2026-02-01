import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function CGVPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="pt-32 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-8">
            Conditions Générales de Vente
          </h1>

          <div className="prose prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">1. Objet</h2>
              <p className="text-foreground-muted">
                Les présentes Conditions Générales de Vente régissent les relations contractuelles
                entre Verger & Com et ses clients professionnels pour la vente et la livraison
                de paniers de fruits frais.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">2. Produits</h2>
              <p className="text-foreground-muted">
                Verger & Com propose des paniers de fruits frais de saison, des jus de fruits
                et des fruits secs. Les produits sont sélectionnés pour leur qualité et leur fraîcheur.
                La composition des paniers peut varier selon les saisons et la disponibilité des produits.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">3. Commandes</h2>
              <p className="text-foreground-muted">
                Les commandes sont passées via notre site internet. Toute commande vaut acceptation
                des présentes CGV. Un email de confirmation est envoyé après validation du paiement.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">4. Prix et Paiement</h2>
              <p className="text-foreground-muted">
                Les prix sont indiqués en euros TTC. Le paiement s&apos;effectue en ligne par carte
                bancaire via notre partenaire sécurisé Stripe. La livraison est offerte pour
                toutes les commandes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">5. Livraison</h2>
              <p className="text-foreground-muted">
                Les livraisons sont effectuées dans un délai de 24 à 48 heures ouvrées après
                confirmation de la commande. Les livraisons sont assurées du lundi au vendredi,
                dans les locaux professionnels indiqués lors de la commande.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">6. Réclamations</h2>
              <p className="text-foreground-muted">
                Toute réclamation concernant la qualité des produits doit être formulée dans les
                24 heures suivant la livraison. Contactez-nous par email pour toute demande.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">7. Données personnelles</h2>
              <p className="text-foreground-muted">
                Les données collectées sont utilisées uniquement pour le traitement des commandes
                et ne sont pas transmises à des tiers. Conformément au RGPD, vous disposez d&apos;un
                droit d&apos;accès, de modification et de suppression de vos données.
              </p>
            </section>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
