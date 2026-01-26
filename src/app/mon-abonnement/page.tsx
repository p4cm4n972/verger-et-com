'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

interface Subscription {
  id: string;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  default_order_data: unknown;
  next_delivery_date: string;
  is_active: boolean;
  created_at: string;
}

const FREQUENCY_LABELS: Record<string, { label: string; description: string }> = {
  weekly: { label: 'Hebdomadaire', description: 'Chaque semaine' },
  biweekly: { label: 'Bi-mensuel', description: 'Toutes les 2 semaines' },
  monthly: { label: 'Mensuel', description: 'Chaque mois' },
};

type Step = 'email' | 'code' | 'subscription';

export default function MonAbonnementPage() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Vérifier si on a une session en cours
  useEffect(() => {
    const savedToken = sessionStorage.getItem('customerSessionToken');
    const savedEmail = sessionStorage.getItem('customerEmail');
    if (savedToken && savedEmail) {
      setEmail(savedEmail);
      setStep('subscription');
      fetchSubscription(savedEmail);
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
        sessionStorage.setItem('customerSessionToken', data.sessionToken);
        sessionStorage.setItem('customerEmail', data.email);
        setStep('subscription');
        fetchSubscription(data.email);
      }
    } catch {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscription = async (customerEmail: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/customer/subscription?email=${encodeURIComponent(customerEmail)}`);
      const data = await response.json();
      if (!data.error) {
        setSubscription(data.subscription);
      }
    } catch {
      setError('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Êtes-vous sûr de vouloir annuler votre abonnement ?')) {
      return;
    }

    setCancelling(true);

    try {
      const response = await fetch(`/api/customer/subscription?email=${encodeURIComponent(email)}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        setSubscription(null);
        alert('Votre abonnement a été annulé');
      }
    } catch {
      setError('Erreur lors de l\'annulation');
    } finally {
      setCancelling(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('customerSessionToken');
    sessionStorage.removeItem('customerEmail');
    setEmail('');
    setCode('');
    setSubscription(null);
    setStep('email');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="pt-32 pb-20 px-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-2">Mon abonnement</h1>
          <p className="text-foreground-muted mb-8">
            Gérez votre abonnement de livraison de fruits
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

          {/* Étape 3: Abonnement */}
          {step === 'subscription' && (
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
              ) : subscription ? (
                <div className="bg-background-card rounded-2xl p-6 border border-fruit-green/30">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-3xl">🔄</span>
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        Abonnement actif
                      </h2>
                      <p className="text-fruit-green text-sm">
                        {FREQUENCY_LABELS[subscription.frequency]?.label}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between items-center p-4 bg-background rounded-xl">
                      <div>
                        <p className="text-sm text-foreground-muted">Fréquence</p>
                        <p className="text-white font-medium">
                          {FREQUENCY_LABELS[subscription.frequency]?.description}
                        </p>
                      </div>
                      <span className="text-2xl">📅</span>
                    </div>

                    <div className="flex justify-between items-center p-4 bg-background rounded-xl">
                      <div>
                        <p className="text-sm text-foreground-muted">Prochaine livraison</p>
                        <p className="text-white font-medium capitalize">
                          {formatDate(subscription.next_delivery_date)}
                        </p>
                      </div>
                      <span className="text-2xl">🚚</span>
                    </div>

                    <div className="flex justify-between items-center p-4 bg-background rounded-xl">
                      <div>
                        <p className="text-sm text-foreground-muted">Abonné depuis</p>
                        <p className="text-white font-medium">
                          {formatDate(subscription.created_at)}
                        </p>
                      </div>
                      <span className="text-2xl">⭐</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link
                      href="/commander"
                      className="flex-1 text-center px-6 py-3 bg-fruit-green text-background font-semibold rounded-xl hover:opacity-90 transition-all"
                    >
                      Modifier ma commande
                    </Link>
                    <button
                      onClick={handleCancel}
                      disabled={cancelling}
                      className="px-6 py-3 border-2 border-fruit-red/50 text-fruit-red font-semibold rounded-xl hover:bg-fruit-red/10 transition-all disabled:opacity-50"
                    >
                      {cancelling ? 'Annulation...' : 'Annuler l\'abonnement'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-background-card rounded-2xl p-8 border border-border text-center">
                  <span className="text-4xl mb-4 block">📭</span>
                  <h2 className="text-xl font-bold text-white mb-2">
                    Pas encore d&apos;abonnement
                  </h2>
                  <p className="text-foreground-muted mb-6">
                    Simplifiez-vous la vie avec un abonnement automatique
                  </p>

                  <div className="grid gap-4 mb-6">
                    {Object.entries(FREQUENCY_LABELS).map(([key, { label, description }]) => (
                      <div
                        key={key}
                        className="p-4 bg-background rounded-xl border border-border text-left"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">
                            {key === 'weekly' ? '🗓️' : key === 'biweekly' ? '📆' : '🗒️'}
                          </span>
                          <div>
                            <p className="text-white font-medium">{label}</p>
                            <p className="text-sm text-foreground-muted">{description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Link
                    href="/commander"
                    className="inline-block px-8 py-4 bg-gradient-to-r from-fruit-green to-fruit-green/80 text-background font-semibold rounded-full hover:opacity-90 transition-all"
                  >
                    Créer mon abonnement
                  </Link>
                </div>
              )}

              {/* Lien vers historique */}
              <div className="mt-8 text-center">
                <Link
                  href="/mes-commandes"
                  className="text-fruit-orange hover:underline"
                >
                  Voir l&apos;historique de mes commandes →
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
