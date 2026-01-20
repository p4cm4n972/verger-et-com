'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useCart } from '@/lib/cart/CartContext';

export default function CommanderPage() {
  const { items: cart, removeItem, updateQuantity, total: subtotal } = useCart();

  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');

  const deliveryFee = 0; // Livraison offerte
  const total = subtotal + deliveryFee;

  const handleCheckout = async () => {
    if (!email) {
      alert('Veuillez entrer votre email');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart,
          customerEmail: email,
        }),
      });

      const { url, error } = await response.json();

      if (error) {
        throw new Error(error);
      }

      // Rediriger vers Stripe Checkout
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Erreur checkout:', error);
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      alert(`Erreur: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-2">Commander</h1>
          <p className="text-foreground-muted mb-8">
            Vérifiez votre commande et procédez au paiement
          </p>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Panier */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-xl font-bold text-white mb-4">Votre panier</h2>

              {cart.length === 0 ? (
                <div className="bg-background-card rounded-2xl p-8 border border-border text-center">
                  <span className="text-4xl mb-4 block">🧺</span>
                  <p className="text-foreground-muted mb-4">Votre panier est vide</p>
                  <Link
                    href="/paniers"
                    className="inline-block px-6 py-2 bg-fruit-green text-background font-semibold rounded-full"
                  >
                    Voir les paniers
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div
                      key={item.productId}
                      className="bg-background-card rounded-2xl p-4 border border-border flex items-center gap-4"
                    >
                      <div className="w-16 h-16 bg-fruit-green/20 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">
                          {item.type === 'basket' ? '🧺' : item.type === 'juice' ? '🍊' : '🥜'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-white">{item.name}</h3>
                        {item.description && (
                          <p className="text-sm text-foreground-muted">{item.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="w-8 h-8 rounded-lg bg-background border border-border text-white hover:border-fruit-green transition-colors"
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-white">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="w-8 h-8 rounded-lg bg-background border border-border text-white hover:border-fruit-green transition-colors"
                          >
                            +
                          </button>
                        </div>
                        <div className="text-right min-w-[60px]">
                          <div className="text-xl font-bold text-fruit-green">{item.price * item.quantity}€</div>
                        </div>
                        <button
                          onClick={() => removeItem(item.productId)}
                          className="w-8 h-8 rounded-lg bg-fruit-red/20 text-fruit-red hover:bg-fruit-red/30 transition-colors"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Email */}
              <div className="bg-background-card rounded-2xl p-6 border border-border mt-6">
                <h2 className="text-lg font-bold text-white mb-4">Vos coordonnées</h2>
                <div>
                  <label htmlFor="email" className="block text-sm text-foreground-muted mb-2">
                    Email professionnel
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@entreprise.fr"
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl text-white placeholder-foreground-muted focus:border-fruit-green focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Récapitulatif */}
            <div>
              <div className="bg-background-card rounded-2xl p-6 border border-border sticky top-24">
                <h2 className="text-lg font-bold text-white mb-4">Récapitulatif</h2>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-foreground-muted">
                    <span>Sous-total</span>
                    <span>{subtotal}€</span>
                  </div>
                  <div className="flex justify-between text-foreground-muted">
                    <span>Livraison</span>
                    <span className="text-fruit-green">Offerte</span>
                  </div>
                  <div className="border-t border-border pt-3 flex justify-between">
                    <span className="font-bold text-white">Total</span>
                    <span className="text-2xl font-bold text-fruit-green">{total}€</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={loading || cart.length === 0}
                  className="w-full py-4 bg-gradient-to-r from-fruit-green to-fruit-green/80 text-background font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Chargement...' : 'Payer maintenant'}
                </button>

                <p className="text-xs text-foreground-muted text-center mt-4">
                  Paiement sécurisé par Stripe
                </p>

                {/* Moyens de paiement */}
                <div className="flex justify-center gap-2 mt-4">
                  <div className="w-10 h-6 bg-white rounded flex items-center justify-center text-xs font-bold text-blue-600">
                    VISA
                  </div>
                  <div className="w-10 h-6 bg-white rounded flex items-center justify-center text-xs font-bold text-red-500">
                    MC
                  </div>
                  <div className="w-10 h-6 bg-white rounded flex items-center justify-center text-xs font-bold text-blue-500">
                    CB
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
