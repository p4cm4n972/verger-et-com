'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Mot de passe incorrect');
      }

      // Stocker le token dans sessionStorage
      sessionStorage.setItem('admin_token', data.token);
      router.push('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🧺</div>
          <h1 className="text-2xl font-bold text-white">Administration</h1>
          <p className="text-foreground-muted">Verger & Com</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-background-card rounded-2xl p-8 border border-border">
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm text-foreground-muted mb-2">
              Mot de passe admin
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-background border border-border rounded-xl text-white placeholder-foreground-muted focus:border-fruit-green focus:outline-none transition-colors"
              required
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-fruit-red/20 border border-fruit-red/50 rounded-xl text-fruit-red text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-fruit-green text-background font-semibold rounded-xl hover:bg-fruit-green/90 transition-all disabled:opacity-50"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <p className="text-center text-foreground-muted text-sm mt-6">
          <a href="/" className="hover:text-white transition-colors">
            ← Retour au site
          </a>
        </p>
      </div>
    </div>
  );
}
