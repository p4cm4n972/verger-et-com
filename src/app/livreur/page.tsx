'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

interface Order {
  id: string;
  created_at: string;
  status: string;
  total: number;
  delivery_date: string;
  delivery_address: string;
  customer_email: string;
  preferred_delivery_day: string;
}

export default function LivreurPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [driverName, setDriverName] = useState('');
  const [filter, setFilter] = useState<'all' | 'today' | 'upcoming'>('upcoming');

  useEffect(() => {
    const token = sessionStorage.getItem('driverToken');
    const name = sessionStorage.getItem('driverName');
    if (!token) {
      router.push('/livreur/login');
    } else {
      setIsAuthenticated(true);
      setDriverName(name || 'Livreur');
      fetchOrders();
    }
  }, [router]);

  const fetchOrders = async () => {
    try {
      const token = sessionStorage.getItem('driverToken');
      const response = await fetch('/api/driver/orders', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Erreur fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkDelivered = async (orderId: string) => {
    try {
      const token = sessionStorage.getItem('driverToken');
      const response = await fetch(`/api/driver/orders/${orderId}/deliver`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchOrders();
      } else {
        alert('Erreur lors de la validation');
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('driverToken');
    sessionStorage.removeItem('driverName');
    router.push('/livreur/login');
  };

  const filteredOrders = orders.filter((order) => {
    const today = new Date().toISOString().split('T')[0];
    if (filter === 'today') {
      return order.delivery_date === today;
    }
    if (filter === 'upcoming') {
      return order.delivery_date >= today && order.status !== 'delivered';
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      confirmed: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Confirmée' },
      preparing: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'En préparation' },
      delivered: { bg: 'bg-fruit-green/20', text: 'text-fruit-green', label: 'Livrée' },
      cancelled: { bg: 'bg-fruit-red/20', text: 'text-fruit-red', label: 'Annulée' },
    };
    const badge = badges[status] || badges.confirmed;
    return (
      <span className={`px-2 py-1 rounded-full text-xs ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const formatDeliveryDay = (day: string) => {
    return day === 'monday' ? 'Lundi' : day === 'tuesday' ? 'Mardi' : day;
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white">
                Bonjour {driverName} !
              </h1>
              <p className="text-foreground-muted">
                Gérez vos livraisons du jour
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="https://t.me/VergerEtComBot"
                target="_blank"
                className="px-4 py-2 bg-[#0088cc] text-white rounded-lg hover:bg-[#0088cc]/80 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.03-1.99 1.27-5.62 3.72-.53.36-1.01.54-1.44.53-.47-.01-1.38-.27-2.06-.49-.83-.27-1.49-.42-1.43-.89.03-.25.38-.51 1.05-.78 4.12-1.79 6.87-2.97 8.26-3.54 3.93-1.62 4.75-1.9 5.28-1.91.12 0 .37.03.54.17.14.12.18.28.2.46-.01.06.01.24 0 .38z" />
                </svg>
                Telegram
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 border border-border text-foreground-muted rounded-lg hover:border-fruit-red hover:text-fruit-red transition-colors"
              >
                Déconnexion
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-background-card rounded-xl p-4 border border-border">
              <div className="text-2xl font-bold text-white">
                {orders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled').length}
              </div>
              <div className="text-sm text-foreground-muted">À livrer</div>
            </div>
            <div className="bg-background-card rounded-xl p-4 border border-border">
              <div className="text-2xl font-bold text-fruit-green">
                {orders.filter((o) => o.status === 'delivered').length}
              </div>
              <div className="text-sm text-foreground-muted">Livrées</div>
            </div>
            <div className="bg-background-card rounded-xl p-4 border border-border">
              <div className="text-2xl font-bold text-yellow-400">
                {orders.filter((o) => o.delivery_date === new Date().toISOString().split('T')[0]).length}
              </div>
              <div className="text-sm text-foreground-muted">Aujourd&apos;hui</div>
            </div>
            <div className="bg-background-card rounded-xl p-4 border border-border">
              <div className="text-2xl font-bold text-fruit-orange">
                {orders.reduce((sum, o) => sum + (o.status !== 'cancelled' ? o.total : 0), 0)}€
              </div>
              <div className="text-sm text-foreground-muted">Total</div>
            </div>
          </div>

          {/* Filtres */}
          <div className="flex gap-2 mb-6">
            {[
              { key: 'upcoming', label: 'À venir' },
              { key: 'today', label: 'Aujourd\'hui' },
              { key: 'all', label: 'Toutes' },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key as typeof filter)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === f.key
                    ? 'bg-fruit-green text-background'
                    : 'bg-background-card text-foreground-muted hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Liste des commandes */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fruit-green mx-auto"></div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="bg-background-card rounded-2xl p-8 border border-border text-center">
              <span className="text-4xl mb-4 block">📦</span>
              <p className="text-foreground-muted">Aucune livraison pour le moment</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-background-card rounded-2xl p-6 border border-border"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono text-foreground-muted text-sm">
                          #{order.id.slice(0, 8)}
                        </span>
                        {getStatusBadge(order.status)}
                      </div>
                      <div className="grid md:grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-foreground-muted">📅 </span>
                          <span className="text-white">
                            {formatDeliveryDay(order.preferred_delivery_day)} - {order.delivery_date}
                          </span>
                        </div>
                        <div>
                          <span className="text-foreground-muted">👤 </span>
                          <span className="text-white">{order.customer_email}</span>
                        </div>
                        <div className="md:col-span-2">
                          <span className="text-foreground-muted">📍 </span>
                          <span className="text-white">{order.delivery_address || 'Adresse à confirmer'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-fruit-green">{order.total}€</div>
                      </div>
                      {order.status !== 'delivered' && order.status !== 'cancelled' && (
                        <button
                          onClick={() => handleMarkDelivered(order.id)}
                          className="px-4 py-2 bg-fruit-green text-background font-semibold rounded-lg hover:bg-fruit-green/80 transition-colors"
                        >
                          ✓ Livré
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
