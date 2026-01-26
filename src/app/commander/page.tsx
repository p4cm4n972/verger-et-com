'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useCart } from '@/lib/cart/CartContext';
import { getDeliveryOptions, formatDateForApi, type DeliveryDay, type DeliveryOption } from '@/lib/delivery';

type SubscriptionFrequency = 'weekly' | 'biweekly' | 'monthly' | null;
type SubscriptionPlan = 'discovery' | 'team' | 'enterprise' | null;

// Mapper les IDs de paniers vers les plans d'abonnement Stripe
const BASKET_TO_PLAN: Record<string, SubscriptionPlan> = {
  'basket-5kg': 'discovery',
  'basket-8kg': 'team',
  'basket-12kg': 'enterprise',
};

const FREQUENCY_OPTIONS = [
  { value: 'weekly' as const, label: 'Chaque semaine', emoji: '🗓️' },
  { value: 'biweekly' as const, label: 'Toutes les 2 semaines', emoji: '📆' },
  { value: 'monthly' as const, label: 'Chaque mois', emoji: '🗒️' },
];

export default function CommanderPage() {
  const { items: cart, removeItem, updateQuantity, total: subtotal } = useCart();

  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [address, setAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [deliveryOptions, setDeliveryOptions] = useState<DeliveryOption[]>([]);
  const [selectedDeliveryDay, setSelectedDeliveryDay] = useState<DeliveryDay | null>(null);
  const [isSubscription, setIsSubscription] = useState(false);
  const [subscriptionFrequency, setSubscriptionFrequency] = useState<SubscriptionFrequency>(null);

  // Calculer les options de livraison au chargement
  useEffect(() => {
    const options = getDeliveryOptions();
    setDeliveryOptions(options);
    // Sélectionner la première option par défaut (la plus proche)
    if (options.length > 0) {
      setSelectedDeliveryDay(options[0].day);
    }
  }, []);

  const deliveryFee = 0; // Livraison offerte
  const total = subtotal + deliveryFee;

  const handleCheckout = async () => {
    if (!email) {
      alert('Veuillez entrer votre email');
      return;
    }

    if (!phone) {
      alert('Veuillez entrer votre numéro de téléphone');
      return;
    }

    if (!companyName) {
      alert('Veuillez entrer le nom de votre entreprise');
      return;
    }

    if (!address || !postalCode || !city) {
      alert('Veuillez entrer l\'adresse de livraison complète');
      return;
    }

    if (!selectedDeliveryDay) {
      alert('Veuillez choisir un jour de livraison');
      return;
    }

    const selectedOption = deliveryOptions.find(o => o.day === selectedDeliveryDay);
    if (!selectedOption) {
      alert('Erreur: option de livraison invalide');
      return;
    }

    const fullAddress = `${companyName}\n${address}\n${postalCode} ${city}`;

    setLoading(true);

    // Sauvegarder l'email pour l'espace client
    localStorage.setItem('customerEmail', email);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart,
          customerEmail: email,
          customerPhone: phone,
          deliveryDay: selectedDeliveryDay,
          deliveryDate: formatDateForApi(selectedOption.date),
          deliveryAddress: fullAddress,
          isSubscription,
          subscriptionFrequency: isSubscription ? subscriptionFrequency : null,
          // Déterminer le plan d'abonnement basé sur le premier panier
          subscriptionPlan: isSubscription
            ? (cart.find(item => item.type === 'basket')?.productId
                ? BASKET_TO_PLAN[cart.find(item => item.type === 'basket')!.productId]
                : null)
            : null,
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

              {/* Coordonnées */}
              <div className="bg-background-card rounded-2xl p-6 border border-border mt-6">
                <h2 className="text-lg font-bold text-white mb-4">Vos coordonnées</h2>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="companyName" className="block text-sm text-foreground-muted mb-2">
                      Nom de l&apos;entreprise *
                    </label>
                    <input
                      type="text"
                      id="companyName"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Ma Super Startup"
                      className="w-full px-4 py-3 bg-background border border-border rounded-xl text-white placeholder-foreground-muted focus:border-fruit-green focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm text-foreground-muted mb-2">
                      Email professionnel *
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
                  <div>
                    <label htmlFor="phone" className="block text-sm text-foreground-muted mb-2">
                      Téléphone *
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="06 12 34 56 78"
                      className="w-full px-4 py-3 bg-background border border-border rounded-xl text-white placeholder-foreground-muted focus:border-fruit-green focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Adresse de livraison */}
              <div className="bg-background-card rounded-2xl p-6 border border-border mt-6">
                <h2 className="text-lg font-bold text-white mb-4">📍 Adresse de livraison</h2>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="address" className="block text-sm text-foreground-muted mb-2">
                      Adresse *
                    </label>
                    <input
                      type="text"
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="123 Rue de la Tech, Bâtiment A"
                      className="w-full px-4 py-3 bg-background border border-border rounded-xl text-white placeholder-foreground-muted focus:border-fruit-green focus:outline-none transition-colors"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="postalCode" className="block text-sm text-foreground-muted mb-2">
                        Code postal *
                      </label>
                      <input
                        type="text"
                        id="postalCode"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        placeholder="75001"
                        className="w-full px-4 py-3 bg-background border border-border rounded-xl text-white placeholder-foreground-muted focus:border-fruit-green focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label htmlFor="city" className="block text-sm text-foreground-muted mb-2">
                        Ville *
                      </label>
                      <input
                        type="text"
                        id="city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Paris"
                        className="w-full px-4 py-3 bg-background border border-border rounded-xl text-white placeholder-foreground-muted focus:border-fruit-green focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Choix du jour de livraison */}
              <div className="bg-background-card rounded-2xl p-6 border border-border mt-6">
                <h2 className="text-lg font-bold text-white mb-4">📅 Jour de livraison</h2>
                <p className="text-sm text-foreground-muted mb-4">
                  Livraisons uniquement les <span className="text-fruit-green font-semibold">lundis</span> et <span className="text-fruit-green font-semibold">mardis</span>
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {deliveryOptions.map((option) => (
                    <button
                      key={option.day}
                      type="button"
                      onClick={() => setSelectedDeliveryDay(option.day)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        selectedDeliveryDay === option.day
                          ? 'border-fruit-green bg-fruit-green/10'
                          : 'border-border hover:border-fruit-green/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            selectedDeliveryDay === option.day
                              ? 'border-fruit-green bg-fruit-green'
                              : 'border-foreground-muted'
                          }`}
                        >
                          {selectedDeliveryDay === option.day && (
                            <svg className="w-2 h-2 text-background" fill="currentColor" viewBox="0 0 8 8">
                              <circle cx="4" cy="4" r="4" />
                            </svg>
                          )}
                        </div>
                        <span className="font-bold text-white">{option.label}</span>
                      </div>
                      <p className="text-sm text-foreground-muted capitalize pl-6">
                        {option.formattedDate}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Option abonnement */}
              <div className="bg-gradient-to-r from-fruit-green/10 to-fruit-orange/10 rounded-2xl p-6 border border-fruit-green/30 mt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🔄</span>
                    <div>
                      <h2 className="text-lg font-bold text-white">Abonnement</h2>
                      <p className="text-sm text-foreground-muted">Recevez automatiquement</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSubscription(!isSubscription);
                      if (!isSubscription) {
                        setSubscriptionFrequency('weekly');
                      } else {
                        setSubscriptionFrequency(null);
                      }
                    }}
                    className={`w-14 h-8 rounded-full transition-all ${
                      isSubscription ? 'bg-fruit-green' : 'bg-border'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 bg-white rounded-full transition-transform ${
                        isSubscription ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {isSubscription && (
                  <div className="space-y-3">
                    <p className="text-sm text-foreground-muted">Fréquence de livraison :</p>
                    <div className="grid grid-cols-3 gap-3">
                      {FREQUENCY_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setSubscriptionFrequency(option.value)}
                          className={`p-3 rounded-xl border-2 text-center transition-all ${
                            subscriptionFrequency === option.value
                              ? 'border-fruit-green bg-fruit-green/10'
                              : 'border-border hover:border-fruit-green/50'
                          }`}
                        >
                          <span className="text-xl block mb-1">{option.emoji}</span>
                          <span className="text-xs text-white">{option.label}</span>
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-fruit-green">
                      Vous pouvez annuler à tout moment depuis votre espace client
                    </p>
                  </div>
                )}
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
                  {isSubscription && subscriptionFrequency && (
                    <div className="flex justify-between text-fruit-orange">
                      <span>🔄 Abonnement</span>
                      <span className="text-xs">
                        {subscriptionFrequency === 'weekly' && 'Hebdo'}
                        {subscriptionFrequency === 'biweekly' && '2 sem.'}
                        {subscriptionFrequency === 'monthly' && 'Mensuel'}
                      </span>
                    </div>
                  )}
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
