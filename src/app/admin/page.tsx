'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface Order {
  id: string;
  created_at: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'delivered' | 'cancelled';
  subtotal: number;
  delivery_fee: number;
  total: number;
  delivery_date: string;
  delivery_address: string;
  notes: string;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'En attente', color: 'bg-yellow-500/20 text-yellow-500' },
  confirmed: { label: 'Confirmée', color: 'bg-blue-500/20 text-blue-500' },
  preparing: { label: 'En préparation', color: 'bg-orange-500/20 text-orange-500' },
  delivered: { label: 'Livrée', color: 'bg-green-500/20 text-green-500' },
  cancelled: { label: 'Annulée', color: 'bg-red-500/20 text-red-500' },
};

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(orders.map(order =>
        order.id === orderId ? { ...order, status: newStatus as Order['status'] } : order
      ));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur de mise à jour');
    }
  };

  const filteredOrders = filter === 'all'
    ? orders
    : orders.filter(order => order.status === filter);

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    revenue: orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + o.total, 0),
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background-card border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-2xl">🧺</Link>
            <h1 className="text-xl font-bold text-white">Admin - Commandes</h1>
          </div>
          <Link
            href="/"
            className="px-4 py-2 text-foreground-muted hover:text-white transition-colors"
          >
            ← Retour au site
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          <div className="bg-background-card rounded-xl p-4 border border-border">
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <div className="text-sm text-foreground-muted">Total</div>
          </div>
          <div className="bg-background-card rounded-xl p-4 border border-border">
            <div className="text-2xl font-bold text-yellow-500">{stats.pending}</div>
            <div className="text-sm text-foreground-muted">En attente</div>
          </div>
          <div className="bg-background-card rounded-xl p-4 border border-border">
            <div className="text-2xl font-bold text-blue-500">{stats.confirmed}</div>
            <div className="text-sm text-foreground-muted">Confirmées</div>
          </div>
          <div className="bg-background-card rounded-xl p-4 border border-border">
            <div className="text-2xl font-bold text-orange-500">{stats.preparing}</div>
            <div className="text-sm text-foreground-muted">En préparation</div>
          </div>
          <div className="bg-background-card rounded-xl p-4 border border-border">
            <div className="text-2xl font-bold text-green-500">{stats.delivered}</div>
            <div className="text-sm text-foreground-muted">Livrées</div>
          </div>
          <div className="bg-background-card rounded-xl p-4 border border-border">
            <div className="text-2xl font-bold text-fruit-green">{stats.revenue}€</div>
            <div className="text-sm text-foreground-muted">Chiffre d'affaires</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {['all', 'pending', 'confirmed', 'preparing', 'delivered', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === status
                  ? 'bg-fruit-green text-background'
                  : 'bg-background-card text-foreground-muted hover:text-white border border-border'
              }`}
            >
              {status === 'all' ? 'Toutes' : statusLabels[status]?.label || status}
            </button>
          ))}
        </div>

        {/* Orders list */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">⏳</div>
            <p className="text-foreground-muted">Chargement des commandes...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">❌</div>
            <p className="text-fruit-red">{error}</p>
            <button
              onClick={fetchOrders}
              className="mt-4 px-4 py-2 bg-fruit-green text-background rounded-lg"
            >
              Réessayer
            </button>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📭</div>
            <p className="text-foreground-muted">Aucune commande trouvée</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="bg-background-card rounded-xl p-6 border border-border"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-white font-mono text-sm">
                        #{order.id.slice(0, 8)}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusLabels[order.status]?.color}`}>
                        {statusLabels[order.status]?.label}
                      </span>
                    </div>
                    <div className="text-sm text-foreground-muted space-y-1">
                      <p>📅 Créée le {new Date(order.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</p>
                      {order.delivery_date && (
                        <p>🚚 Livraison prévue: {new Date(order.delivery_date).toLocaleDateString('fr-FR')}</p>
                      )}
                      {order.delivery_address && (
                        <p>📍 {order.delivery_address}</p>
                      )}
                      {order.notes && (
                        <p className="text-xs opacity-70">💬 {order.notes}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-fruit-green">{order.total}€</div>
                      <div className="text-xs text-foreground-muted">
                        Sous-total: {order.subtotal}€
                      </div>
                    </div>

                    <select
                      value={order.status}
                      onChange={(e) => updateStatus(order.id, e.target.value)}
                      className="px-3 py-2 bg-background border border-border rounded-lg text-white text-sm focus:border-fruit-green focus:outline-none"
                    >
                      <option value="pending">En attente</option>
                      <option value="confirmed">Confirmée</option>
                      <option value="preparing">En préparation</option>
                      <option value="delivered">Livrée</option>
                      <option value="cancelled">Annulée</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
