'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'envoi');
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">Contactez-nous</h1>
            <p className="text-xl text-foreground-muted">
              Une question ? Un besoin spécifique ? Notre équipe vous répond rapidement.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Informations de contact */}
            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-bold text-white mb-4">Nos coordonnées</h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-fruit-green/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-xl">📧</span>
                    </div>
                    <div>
                      <div className="font-medium text-white">Email</div>
                      <a href="mailto:contact@verger-et-com.fr" className="text-fruit-green hover:underline">
                        contact@verger-et-com.fr
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-fruit-orange/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-xl">📞</span>
                    </div>
                    <div>
                      <div className="font-medium text-white">Téléphone</div>
                      <a href="tel:+33123456789" className="text-fruit-orange hover:underline">
                        01 23 45 67 89
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-fruit-yellow/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-xl">📍</span>
                    </div>
                    <div>
                      <div className="font-medium text-white">Adresse</div>
                      <p className="text-foreground-muted">
                        123 Avenue des Vergers<br />
                        75001 Paris, France
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold text-white mb-4">Horaires</h2>
                <div className="bg-background-card rounded-xl p-4 border border-border">
                  <div className="flex justify-between text-foreground-muted mb-2">
                    <span>Lundi - Vendredi</span>
                    <span className="text-white">9h - 18h</span>
                  </div>
                  <div className="flex justify-between text-foreground-muted">
                    <span>Samedi - Dimanche</span>
                    <span className="text-fruit-red">Fermé</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Formulaire */}
            <div className="bg-background-card rounded-2xl p-6 border border-border">
              {submitted ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-fruit-green/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">✓</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Message envoyé !</h3>
                  <p className="text-foreground-muted">
                    Nous vous répondrons dans les plus brefs délais.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm text-foreground-muted mb-2">
                      Nom complet
                    </label>
                    <input
                      type="text"
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 bg-background border border-border rounded-xl text-white placeholder-foreground-muted focus:border-fruit-green focus:outline-none transition-colors"
                      placeholder="Jean Dupont"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm text-foreground-muted mb-2">
                      Email professionnel
                    </label>
                    <input
                      type="email"
                      id="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 bg-background border border-border rounded-xl text-white placeholder-foreground-muted focus:border-fruit-green focus:outline-none transition-colors"
                      placeholder="jean@entreprise.fr"
                    />
                  </div>

                  <div>
                    <label htmlFor="company" className="block text-sm text-foreground-muted mb-2">
                      Entreprise
                    </label>
                    <input
                      type="text"
                      id="company"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full px-4 py-3 bg-background border border-border rounded-xl text-white placeholder-foreground-muted focus:border-fruit-green focus:outline-none transition-colors"
                      placeholder="Nom de votre entreprise"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm text-foreground-muted mb-2">
                      Message
                    </label>
                    <textarea
                      id="message"
                      required
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-3 bg-background border border-border rounded-xl text-white placeholder-foreground-muted focus:border-fruit-green focus:outline-none transition-colors resize-none"
                      placeholder="Décrivez votre besoin..."
                    />
                  </div>

                  {error && (
                    <div className="p-3 bg-fruit-red/20 border border-fruit-red/50 rounded-xl text-fruit-red text-sm">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-fruit-green text-background font-semibold rounded-xl hover:bg-fruit-green/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Envoi en cours...' : 'Envoyer le message'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
