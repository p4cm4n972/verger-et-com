'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

interface OrderItem {
  id: string;
  product_type: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Order {
  id: string;
  status: string;
  total: number;
  delivery_date: string;
  delivery_address: string;
  created_at: string;
  order_items: OrderItem[];
  delivery_proof_url: string | null;
}

const STATUS_LABELS: Record<string, { label: string; color: string; emoji: string }> = {
  pending: { label: 'En attente', color: 'text-fruit-yellow', emoji: '🕐' },
  confirmed: { label: 'Confirmée', color: 'text-fruit-orange', emoji: '✅' },
  preparing: { label: 'En préparation', color: 'text-fruit-orange', emoji: '📦' },
  delivered: { label: 'Livrée', color: 'text-fruit-green', emoji: '🚚' },
  cancelled: { label: 'Annulée', color: 'text-fruit-red', emoji: '❌' },
};

type Step = 'email' | 'code' | 'orders';

export default function MesCommandesPage() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [photoModal, setPhotoModal] = useState<{ url: string; orderId: string } | null>(null);

  // Vérifier si on a une session en cours
  useEffect(() => {
    const savedToken = sessionStorage.getItem('customerSessionToken');
    const savedEmail = sessionStorage.getItem('customerEmail');
    if (savedToken && savedEmail) {
      setEmail(savedEmail);
      setStep('orders');
      fetchOrders(savedEmail);
    }
  }, []);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Veuillez entrer votre email');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/customer/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        setStep('code');
      }
    } catch {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) {
      setError('Veuillez entrer le code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/customer/verify', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        // Sauvegarder la session
        sessionStorage.setItem('customerSessionToken', data.sessionToken);
        sessionStorage.setItem('customerEmail', data.email);
        setStep('orders');
        fetchOrders(data.email);
      }
    } catch {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async (customerEmail: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/customer/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: customerEmail }),
      });

      const data = await response.json();
      if (!data.error) {
        setOrders(data.orders || []);
      }
    } catch {
      setError('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('customerSessionToken');
    sessionStorage.removeItem('customerEmail');
    setEmail('');
    setCode('');
    setOrders([]);
    setStep('email');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-2">Mes commandes</h1>
          <p className="text-foreground-muted mb-8">
            Consultez l&apos;historique de vos commandes
          </p>

          {/* Étape 1: Email */}
          {step === 'email' && (
            <form onSubmit={handleSendCode}>
              <div className="bg-background-card rounded-2xl p-6 border border-border">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">📧</span>
                  <div>
                    <h2 className="text-lg font-bold text-white">Vérification email</h2>
                    <p className="text-sm text-foreground-muted">
                      Nous vous enverrons un code de vérification
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@entreprise.fr"
                    className="flex-1 px-4 py-3 bg-background border border-border rounded-xl text-white placeholder-foreground-muted focus:border-fruit-green focus:outline-none transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-gradient-to-r from-fruit-green to-fruit-green/80 text-background font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-50"
                  >
                    {loading ? 'Envoi...' : 'Recevoir le code'}
                  </button>
                </div>
                {error && (
                  <p className="text-fruit-red text-sm mt-2">{error}</p>
                )}
              </div>
            </form>
          )}

          {/* Étape 2: Code */}
          {step === 'code' && (
            <form onSubmit={handleVerifyCode}>
              <div className="bg-background-card rounded-2xl p-6 border border-border">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">🔐</span>
                  <div>
                    <h2 className="text-lg font-bold text-white">Entrez le code</h2>
                    <p className="text-sm text-foreground-muted">
                      Code envoyé à <span className="text-fruit-green">{email}</span>
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    maxLength={6}
                    className="flex-1 px-4 py-3 bg-background border border-border rounded-xl text-white placeholder-foreground-muted focus:border-fruit-green focus:outline-none transition-colors text-center text-2xl tracking-widest font-mono"
                  />
                  <button
                    type="submit"
                    disabled={loading || code.length !== 6}
                    className="px-6 py-3 bg-gradient-to-r from-fruit-green to-fruit-green/80 text-background font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-50"
                  >
                    {loading ? 'Vérification...' : 'Vérifier'}
                  </button>
                </div>
                {error && (
                  <p className="text-fruit-red text-sm mt-2">{error}</p>
                )}
                <div className="flex gap-4 mt-4">
                  <button
                    type="button"
                    onClick={() => setStep('email')}
                    className="text-sm text-foreground-muted hover:text-white"
                  >
                    ← Changer d&apos;email
                  </button>
                  <button
                    type="button"
                    onClick={handleSendCode}
                    className="text-sm text-fruit-orange hover:underline"
                  >
                    Renvoyer le code
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Étape 3: Commandes */}
          {step === 'orders' && (
            <>
              {/* En-tête avec déconnexion */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 text-sm text-foreground-muted">
                  <span className="text-fruit-green">✓</span>
                  Connecté en tant que <span className="text-white">{email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-sm text-fruit-red hover:underline"
                >
                  Déconnexion
                </button>
              </div>

              {loading ? (
                <div className="bg-background-card rounded-2xl p-8 border border-border text-center">
                  <span className="text-4xl mb-4 block animate-bounce">🍊</span>
                  <p className="text-foreground-muted">Chargement...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="bg-background-card rounded-2xl p-8 border border-border text-center">
                  <span className="text-4xl mb-4 block">📭</span>
                  <p className="text-foreground-muted mb-4">
                    Aucune commande trouvée pour cet email
                  </p>
                  <Link
                    href="/paniers"
                    className="inline-block px-6 py-2 bg-fruit-green text-background font-semibold rounded-full"
                  >
                    Passer ma première commande
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-foreground-muted">
                    {orders.length} commande{orders.length > 1 ? 's' : ''} trouvée{orders.length > 1 ? 's' : ''}
                  </p>

                  {orders.map((order) => {
                    const status = STATUS_LABELS[order.status] || STATUS_LABELS.pending;

                    return (
                      <div
                        key={order.id}
                        className="bg-background-card rounded-2xl p-6 border border-border"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                          <div>
                            <p className="text-sm text-foreground-muted">
                              Commande du {formatDate(order.created_at)}
                            </p>
                            <p className="text-xs text-foreground-muted/60 font-mono">
                              #{order.id.slice(0, 8)}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${status.color} bg-white/5`}>
                              {status.emoji} {status.label}
                            </span>
                          </div>
                        </div>

                        <div className="border-t border-border pt-4 mb-4">
                          <p className="text-sm text-foreground-muted mb-2">Articles :</p>
                          <ul className="space-y-1">
                            {order.order_items?.map((item) => (
                              <li key={item.id} className="flex justify-between text-sm">
                                <span className="text-white">
                                  {item.quantity}x {item.product_id}
                                </span>
                                <span className="text-foreground-muted">
                                  {item.total_price}€
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4">
                          <div>
                            <p className="text-sm text-foreground-muted">
                              Livraison le {formatDate(order.delivery_date)}
                            </p>
                            {/* Photo de preuve de livraison */}
                            {order.status === 'delivered' && order.delivery_proof_url && (
                              <button
                                onClick={() => setPhotoModal({ url: order.delivery_proof_url!, orderId: order.id })}
                                className="mt-2 inline-flex items-center gap-1 px-3 py-1 bg-fruit-green/20 text-fruit-green rounded-lg text-xs font-medium hover:bg-fruit-green/30 transition-colors"
                              >
                                📸 Voir la preuve de livraison
                              </button>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="text-2xl font-bold text-fruit-green">
                              {order.total}€
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Lien vers abonnement */}
              <div className="mt-8 p-6 bg-gradient-to-r from-fruit-green/10 to-fruit-orange/10 rounded-2xl border border-fruit-green/20">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">
                      Passez en mode abonnement
                    </h3>
                    <p className="text-foreground-muted text-sm">
                      Recevez vos fruits automatiquement chaque semaine
                    </p>
                  </div>
                  <Link
                    href="/mon-abonnement"
                    className="px-6 py-3 bg-fruit-green text-background font-semibold rounded-full hover:opacity-90 transition-all"
                  >
                    Gérer mon abonnement
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Modale photo de preuve de livraison */}
      {photoModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setPhotoModal(null)}
        >
          <div
            className="bg-background-card border border-border rounded-2xl p-4 max-w-2xl mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">
                📸 Preuve de livraison
              </h3>
              <button
                onClick={() => setPhotoModal(null)}
                className="w-8 h-8 rounded-full bg-background flex items-center justify-center text-foreground-muted hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="relative rounded-xl overflow-hidden bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoModal.url}
                alt="Preuve de livraison"
                className="max-w-full max-h-[70vh] mx-auto object-contain"
              />
            </div>
            <p className="mt-4 text-xs text-foreground-muted text-center">
              Commande #{photoModal.orderId.slice(0, 8)} - Photo prise par le livreur
            </p>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
