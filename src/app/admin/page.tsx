'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface Order {
  id: string;
  created_at: string;
  status: 'pending' | 'confirmed' | 'delivered' | 'cancelled';
  subtotal: number;
  delivery_fee: number;
  total: number;
  delivery_date: string;
  delivery_address: string;
  notes: string;
  customer_email: string;
  preferred_delivery_day: 'monday' | 'tuesday' | null;
  assigned_driver_id: string | null;
  driver_status: 'pending' | 'accepted' | 'refused' | null;
}

interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  telegram_chat_id: string | null;
  is_active: boolean;
  drivers: { current_zone: string | null }[] | null;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'En attente', color: 'bg-yellow-500/20 text-yellow-500' },
  confirmed: { label: 'Confirmée', color: 'bg-blue-500/20 text-blue-500' },
  delivered: { label: 'Livrée', color: 'bg-green-500/20 text-green-500' },
  cancelled: { label: 'Annulée', color: 'bg-red-500/20 text-red-500' },
};

const driverStatusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'En attente', color: 'text-yellow-500' },
  accepted: { label: 'Acceptée', color: 'text-green-500' },
  refused: { label: 'Refusée', color: 'text-red-500' },
};

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<'orders' | 'drivers'>('orders');
  const [realtimeStatus, setRealtimeStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [snackbar, setSnackbar] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showDetailedStats, setShowDetailedStats] = useState(false);
  const router = useRouter();

  // Fonction pour afficher un snackbar
  const showSnackbar = (message: string, type: 'success' | 'error' = 'success') => {
    setSnackbar({ message, type });
    setTimeout(() => setSnackbar(null), 4000);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  // Realtime subscriptions pour les mises à jour automatiques
  useEffect(() => {
    if (!isAuthenticated) return;

    const supabase = createClient();

    // Subscription pour les commandes
    const ordersChannel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          console.log('📦 Realtime orders event:', payload.eventType, payload);

          if (payload.eventType === 'INSERT') {
            console.log('🆕 Nouvelle commande reçue:', payload.new);
            setOrders((prev) => [payload.new as Order, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setOrders((prev) =>
              prev.map((order) =>
                order.id === payload.new.id ? (payload.new as Order) : order
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setOrders((prev) =>
              prev.filter((order) => order.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe((status, err) => {
        console.log('📦 Orders channel status:', status, err);
        if (status === 'SUBSCRIBED') {
          setRealtimeStatus('connected');
          console.log('✅ Realtime connecté pour les commandes');
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setRealtimeStatus('disconnected');
          console.error('❌ Erreur Realtime:', err);
        }
      });

    // Subscription pour les livreurs (users avec role=driver)
    const driversChannel = supabase
      .channel('drivers-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
          filter: 'role=eq.driver',
        },
        (payload) => {
          console.log('🚚 Realtime drivers:', payload.eventType);
          // Recharger la liste des livreurs pour avoir les relations
          fetchDrivers();
        }
      )
      .subscribe();

    // Cleanup des subscriptions
    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(driversChannel);
    };
  }, [isAuthenticated]);

  const checkAuth = async () => {
    const token = sessionStorage.getItem('admin_token');

    if (!token) {
      router.push('/admin/login');
      return;
    }

    try {
      const response = await fetch('/api/admin/auth', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        sessionStorage.removeItem('admin_token');
        router.push('/admin/login');
        return;
      }

      setIsAuthenticated(true);
      fetchOrders();
      fetchDrivers();
    } catch {
      router.push('/admin/login');
    }
  };

  const fetchDrivers = async () => {
    try {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('users')
        .select('id, name, email, phone, telegram_chat_id, is_active, drivers(current_zone)')
        .eq('role', 'driver')
        .order('name', { ascending: true });

      setDrivers(data || []);
    } catch (err) {
      console.error('Erreur fetch drivers:', err);
    }
  };

  const formatDeliveryDay = (day: string | null) => {
    if (!day) return '';
    return day === 'monday' ? 'Lundi' : 'Mardi';
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_token');
    router.push('/admin/login');
  };

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
      const token = sessionStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Erreur de mise à jour');
      }

      setOrders(orders.map(order =>
        order.id === orderId ? { ...order, status: newStatus as Order['status'] } : order
      ));

      // Notification de succès
      if (newStatus === 'delivered') {
        showSnackbar('Statut mis à jour et email envoyé au client', 'success');
      } else {
        showSnackbar('Statut mis à jour', 'success');
      }
    } catch (err) {
      showSnackbar(err instanceof Error ? err.message : 'Erreur de mise à jour', 'error');
    }
  };

  const assignDriver = async (orderId: string, driverId: string | null) => {
    try {
      const token = sessionStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          assigned_driver_id: driverId,
          driver_status: driverId ? 'accepted' : 'pending',
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur d\'attribution');
      }

      setOrders(orders.map(order =>
        order.id === orderId
          ? {
              ...order,
              assigned_driver_id: driverId,
              driver_status: driverId ? 'accepted' : 'pending',
            }
          : order
      ));

      if (driverId) {
        const driver = drivers.find(d => d.id === driverId);
        showSnackbar(`Commande attribuée à ${driver?.name || 'livreur'}`, 'success');
      }
    } catch (err) {
      showSnackbar(err instanceof Error ? err.message : 'Erreur d\'attribution', 'error');
    }
  };

  const filteredOrders = filter === 'all'
    ? orders
    : orders.filter(order => order.status === filter);

  const MARGIN_PER_ORDER = 10; // Marge fixe de 10€ par commande

  // Fonctions utilitaires pour les dates
  const isToday = (date: string) => {
    const d = new Date(date);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  };

  const isThisWeek = (date: string) => {
    const d = new Date(date);
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + 1); // Lundi
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    return d >= weekStart && d < weekEnd;
  };

  const isThisMonth = (date: string) => {
    const d = new Date(date);
    const today = new Date();
    return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  };

  const isLastMonth = (date: string) => {
    const d = new Date(date);
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    return d.getMonth() === lastMonth.getMonth() && d.getFullYear() === lastMonth.getFullYear();
  };

  // Stats de base
  const validOrders = orders.filter(o => o.status !== 'cancelled');
  const cancelledOrders = orders.filter(o => o.status === 'cancelled');

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: cancelledOrders.length,
    revenue: validOrders.reduce((sum, o) => sum + o.total, 0),
    margin: validOrders.length * MARGIN_PER_ORDER,
  };

  // Stats temporelles
  const todayOrders = orders.filter(o => isToday(o.created_at));
  const weekOrders = orders.filter(o => isThisWeek(o.created_at));
  const monthOrders = orders.filter(o => isThisMonth(o.created_at));
  const lastMonthOrders = orders.filter(o => isLastMonth(o.created_at));

  const timeStats = {
    today: {
      count: todayOrders.length,
      revenue: todayOrders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + o.total, 0),
      margin: todayOrders.filter(o => o.status !== 'cancelled').length * MARGIN_PER_ORDER,
    },
    week: {
      count: weekOrders.length,
      revenue: weekOrders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + o.total, 0),
      margin: weekOrders.filter(o => o.status !== 'cancelled').length * MARGIN_PER_ORDER,
    },
    month: {
      count: monthOrders.length,
      revenue: monthOrders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + o.total, 0),
      margin: monthOrders.filter(o => o.status !== 'cancelled').length * MARGIN_PER_ORDER,
    },
    lastMonth: {
      count: lastMonthOrders.length,
      revenue: lastMonthOrders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + o.total, 0),
    },
  };

  // Métriques avancées
  const avgBasket = validOrders.length > 0
    ? Math.round(stats.revenue / validOrders.length)
    : 0;

  const cancellationRate = orders.length > 0
    ? Math.round((cancelledOrders.length / orders.length) * 100)
    : 0;

  const deliveryRate = validOrders.length > 0
    ? Math.round((stats.delivered / validOrders.length) * 100)
    : 0;

  // Répartition par jour de livraison
  const dayDistribution = {
    monday: validOrders.filter(o => o.preferred_delivery_day === 'monday').length,
    tuesday: validOrders.filter(o => o.preferred_delivery_day === 'tuesday').length,
    unknown: validOrders.filter(o => !o.preferred_delivery_day).length,
  };

  // Tendance mois vs mois précédent
  const monthTrend = timeStats.lastMonth.count > 0
    ? Math.round(((timeStats.month.count - timeStats.lastMonth.count) / timeStats.lastMonth.count) * 100)
    : timeStats.month.count > 0 ? 100 : 0;

  // Afficher un loader pendant la vérification de l'auth
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🔐</div>
          <p className="text-foreground-muted">Vérification...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background-card border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-2xl">🧺</Link>
            <h1 className="text-xl font-bold text-white">Admin</h1>
            {/* Indicateur Realtime */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-background text-xs">
              <span
                className={`w-2 h-2 rounded-full ${
                  realtimeStatus === 'connected'
                    ? 'bg-green-500 animate-pulse'
                    : realtimeStatus === 'connecting'
                    ? 'bg-yellow-500 animate-pulse'
                    : 'bg-red-500'
                }`}
              />
              <span className="text-foreground-muted">
                {realtimeStatus === 'connected'
                  ? 'Live'
                  : realtimeStatus === 'connecting'
                  ? 'Connexion...'
                  : 'Déconnecté'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="px-4 py-2 text-foreground-muted hover:text-white transition-colors"
            >
              ← Retour au site
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-fruit-red/20 text-fruit-red rounded-lg hover:bg-fruit-red/30 transition-colors"
            >
              Déconnexion
            </button>
          </div>
        </div>
        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-6 pb-0">
          <div className="flex gap-4 border-b border-border -mb-px">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-3 font-medium transition-colors border-b-2 ${
                activeTab === 'orders'
                  ? 'text-fruit-green border-fruit-green'
                  : 'text-foreground-muted border-transparent hover:text-white'
              }`}
            >
              📦 Commandes
            </button>
            <button
              onClick={() => setActiveTab('drivers')}
              className={`px-4 py-3 font-medium transition-colors border-b-2 ${
                activeTab === 'drivers'
                  ? 'text-fruit-green border-fruit-green'
                  : 'text-foreground-muted border-transparent hover:text-white'
              }`}
            >
              🚚 Livreurs ({drivers.length})
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Orders Tab */}
        {activeTab === 'orders' && (
        <>
        {/* Stats principales */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4">
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
            <div className="text-2xl font-bold text-green-500">{stats.delivered}</div>
            <div className="text-sm text-foreground-muted">Livrées</div>
          </div>
          <div className="bg-background-card rounded-xl p-4 border border-border">
            <div className="text-2xl font-bold text-fruit-green">{stats.revenue}€</div>
            <div className="text-sm text-foreground-muted">Chiffre d&apos;affaires</div>
          </div>
          <div className="bg-background-card rounded-xl p-4 border border-border">
            <div className="text-2xl font-bold text-fruit-orange">{stats.margin}€</div>
            <div className="text-sm text-foreground-muted">Bénéfice</div>
          </div>
        </div>

        {/* Bouton pour afficher/masquer les stats détaillées */}
        <button
          onClick={() => setShowDetailedStats(!showDetailedStats)}
          className="w-full mb-6 py-2 px-4 bg-background-card border border-border rounded-lg text-sm text-foreground-muted hover:text-white hover:border-fruit-green transition-colors flex items-center justify-center gap-2"
        >
          {showDetailedStats ? '▲ Masquer les statistiques détaillées' : '▼ Voir les statistiques détaillées'}
        </button>

        {/* Stats détaillées */}
        {showDetailedStats && (
          <div className="mb-8 space-y-6">
            {/* Stats temporelles */}
            <div className="bg-background-card rounded-xl p-6 border border-border">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                📅 Statistiques temporelles
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Aujourd'hui */}
                <div className="bg-background rounded-lg p-4 border border-border">
                  <div className="text-xs text-foreground-muted uppercase mb-2">Aujourd&apos;hui</div>
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-2xl font-bold text-white">{timeStats.today.count}</div>
                      <div className="text-xs text-foreground-muted">commandes</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-fruit-green">{timeStats.today.revenue}€</div>
                      <div className="text-xs text-fruit-orange">+{timeStats.today.margin}€ marge</div>
                    </div>
                  </div>
                </div>
                {/* Cette semaine */}
                <div className="bg-background rounded-lg p-4 border border-border">
                  <div className="text-xs text-foreground-muted uppercase mb-2">Cette semaine</div>
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-2xl font-bold text-white">{timeStats.week.count}</div>
                      <div className="text-xs text-foreground-muted">commandes</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-fruit-green">{timeStats.week.revenue}€</div>
                      <div className="text-xs text-fruit-orange">+{timeStats.week.margin}€ marge</div>
                    </div>
                  </div>
                </div>
                {/* Ce mois */}
                <div className="bg-background rounded-lg p-4 border border-border">
                  <div className="text-xs text-foreground-muted uppercase mb-2">Ce mois</div>
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-2xl font-bold text-white">{timeStats.month.count}</div>
                      <div className="text-xs text-foreground-muted">commandes</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-fruit-green">{timeStats.month.revenue}€</div>
                      <div className="text-xs text-fruit-orange">+{timeStats.month.margin}€ marge</div>
                    </div>
                  </div>
                  {/* Tendance */}
                  <div className="mt-2 pt-2 border-t border-border">
                    <span className={`text-xs ${monthTrend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {monthTrend >= 0 ? '↑' : '↓'} {Math.abs(monthTrend)}% vs mois dernier
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Métriques business */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Indicateurs clés */}
              <div className="bg-background-card rounded-xl p-6 border border-border">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                  📊 Indicateurs clés
                </h3>
                <div className="space-y-4">
                  {/* Panier moyen */}
                  <div className="flex items-center justify-between">
                    <span className="text-foreground-muted">Panier moyen</span>
                    <span className="text-xl font-bold text-white">{avgBasket}€</span>
                  </div>
                  {/* Taux de livraison */}
                  <div className="flex items-center justify-between">
                    <span className="text-foreground-muted">Taux de livraison</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-background rounded-full overflow-hidden">
                        <div
                          className="h-full bg-fruit-green rounded-full transition-all"
                          style={{ width: `${deliveryRate}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-fruit-green">{deliveryRate}%</span>
                    </div>
                  </div>
                  {/* Taux d'annulation */}
                  <div className="flex items-center justify-between">
                    <span className="text-foreground-muted">Taux d&apos;annulation</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-background rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-500 rounded-full transition-all"
                          style={{ width: `${cancellationRate}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-red-500">{cancellationRate}%</span>
                    </div>
                  </div>
                  {/* Annulées */}
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <span className="text-foreground-muted">Commandes annulées</span>
                    <span className="text-lg font-bold text-red-500">{stats.cancelled}</span>
                  </div>
                </div>
              </div>

              {/* Répartition livraisons */}
              <div className="bg-background-card rounded-xl p-6 border border-border">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                  🚚 Répartition par jour de livraison
                </h3>
                <div className="space-y-4">
                  {/* Lundi */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-foreground-muted">Lundi</span>
                      <span className="text-sm font-bold text-white">{dayDistribution.monday} commandes</span>
                    </div>
                    <div className="w-full h-3 bg-background rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: validOrders.length > 0 ? `${(dayDistribution.monday / validOrders.length) * 100}%` : '0%' }}
                      />
                    </div>
                  </div>
                  {/* Mardi */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-foreground-muted">Mardi</span>
                      <span className="text-sm font-bold text-white">{dayDistribution.tuesday} commandes</span>
                    </div>
                    <div className="w-full h-3 bg-background rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full transition-all"
                        style={{ width: validOrders.length > 0 ? `${(dayDistribution.tuesday / validOrders.length) * 100}%` : '0%' }}
                      />
                    </div>
                  </div>
                  {/* Non défini */}
                  {dayDistribution.unknown > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-foreground-muted">Non défini</span>
                        <span className="text-sm font-bold text-white">{dayDistribution.unknown} commandes</span>
                      </div>
                      <div className="w-full h-3 bg-background rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gray-500 rounded-full transition-all"
                          style={{ width: validOrders.length > 0 ? `${(dayDistribution.unknown / validOrders.length) * 100}%` : '0%' }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                {/* Résumé */}
                <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-500">{Math.round((dayDistribution.monday / (validOrders.length || 1)) * 100)}%</div>
                    <div className="text-xs text-foreground-muted">Lundi</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-500">{Math.round((dayDistribution.tuesday / (validOrders.length || 1)) * 100)}%</div>
                    <div className="text-xs text-foreground-muted">Mardi</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {['all', 'pending', 'confirmed', 'delivered', 'cancelled'].map((status) => (
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
                        <p>
                          🚚 Livraison: {formatDeliveryDay(order.preferred_delivery_day)} {new Date(order.delivery_date).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                      {order.customer_email && (
                        <p>👤 {order.customer_email}</p>
                      )}
                      {order.delivery_address && (
                        <p>📍 {order.delivery_address}</p>
                      )}
                      {/* Attribution livreur */}
                      <div className="flex items-center gap-2">
                        <span>🚗</span>
                        <select
                          value={order.assigned_driver_id || ''}
                          onChange={(e) => assignDriver(order.id, e.target.value || null)}
                          className="px-2 py-1 bg-background border border-border rounded text-sm text-white focus:border-fruit-green focus:outline-none"
                        >
                          <option value="">-- Attribuer un livreur --</option>
                          {drivers.filter(d => d.is_active).map((driver) => (
                            <option key={driver.id} value={driver.id}>
                              {driver.name} {driver.drivers?.[0]?.current_zone ? `(${driver.drivers[0].current_zone})` : ''}
                            </option>
                          ))}
                        </select>
                        {order.driver_status && order.assigned_driver_id && (
                          <span className={`text-xs ${driverStatusLabels[order.driver_status]?.color}`}>
                            {driverStatusLabels[order.driver_status]?.label}
                          </span>
                        )}
                      </div>
                      {order.notes && (
                        <p className="text-xs opacity-70">💬 {order.notes}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-fruit-green">{order.total}€</div>
                      <div className="text-xs text-foreground-muted">
                        <p>💰 Bénéfice: <span className="text-fruit-green">10€</span></p>
                        <p>🚚 Dû livreur: <span className="text-fruit-orange">{order.total - 10}€</span></p>
                      </div>
                    </div>

                    <select
                      value={order.status}
                      onChange={(e) => updateStatus(order.id, e.target.value)}
                      className="px-3 py-2 bg-background border border-border rounded-lg text-white text-sm focus:border-fruit-green focus:outline-none"
                    >
                      <option value="pending">En attente</option>
                      <option value="confirmed">Confirmée</option>
                      <option value="delivered">Livrée</option>
                      <option value="cancelled">Annulée</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </>
        )}

        {/* Drivers Tab */}
        {activeTab === 'drivers' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Gestion des livreurs</h2>
              <div className="text-sm text-foreground-muted">
                {drivers.filter(d => d.is_active).length} livreurs actifs
              </div>
            </div>

            {drivers.length === 0 ? (
              <div className="text-center py-12 bg-background-card rounded-xl border border-border">
                <div className="text-4xl mb-4">🚚</div>
                <p className="text-foreground-muted mb-4">Aucun livreur enregistré</p>
                <p className="text-sm text-foreground-muted">
                  Les livreurs peuvent s&apos;inscrire via Telegram avec la commande <code className="bg-background px-2 py-1 rounded">/register</code>
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {drivers.map((driver) => (
                  <div
                    key={driver.id}
                    className="bg-background-card rounded-xl p-6 border border-border"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${
                          driver.is_active ? 'bg-fruit-green/20' : 'bg-gray-500/20'
                        }`}>
                          🚚
                        </div>
                        <div>
                          <h3 className="font-bold text-white">{driver.name}</h3>
                          <p className="text-sm text-foreground-muted">{driver.email}</p>
                          {driver.phone && (
                            <p className="text-sm text-foreground-muted">📞 {driver.phone}</p>
                          )}
                          {driver.drivers?.[0]?.current_zone && (
                            <p className="text-sm text-foreground-muted">📍 {driver.drivers[0].current_zone}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {driver.telegram_chat_id ? (
                          <span className="px-3 py-1 rounded-full text-xs bg-[#0088cc]/20 text-[#0088cc]">
                            📱 Telegram lié
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-500">
                            ⏳ Telegram non lié
                          </span>
                        )}
                        <span className={`px-3 py-1 rounded-full text-xs ${
                          driver.is_active
                            ? 'bg-green-500/20 text-green-500'
                            : 'bg-red-500/20 text-red-500'
                        }`}>
                          {driver.is_active ? '✓ Actif' : '✗ Inactif'}
                        </span>
                      </div>
                    </div>
                    {/* Stats du livreur */}
                    <div className="mt-4 pt-4 border-t border-border grid grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-lg font-bold text-white">
                          {orders.filter(o => o.assigned_driver_id === driver.id && o.status !== 'delivered' && o.status !== 'cancelled').length}
                        </div>
                        <div className="text-xs text-foreground-muted">En cours</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-fruit-green">
                          {orders.filter(o => o.assigned_driver_id === driver.id && o.status === 'delivered').length}
                        </div>
                        <div className="text-xs text-foreground-muted">Livrées</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-white">
                          {orders
                            .filter(o => o.assigned_driver_id === driver.id && o.status === 'delivered')
                            .reduce((sum, o) => sum + o.total, 0)}€
                        </div>
                        <div className="text-xs text-foreground-muted">CA Total</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-fruit-orange">
                          {orders
                            .filter(o => o.assigned_driver_id === driver.id && o.status === 'delivered')
                            .reduce((sum, o) => sum + (o.total - 10), 0)}€
                        </div>
                        <div className="text-xs text-foreground-muted">Solde dû</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Snackbar */}
      {snackbar && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div
            className={`px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 ${
              snackbar.type === 'success'
                ? 'bg-fruit-green text-background'
                : 'bg-fruit-red text-white'
            }`}
          >
            <span className="text-xl">
              {snackbar.type === 'success' ? '✓' : '✗'}
            </span>
            <span className="font-medium">{snackbar.message}</span>
            <button
              onClick={() => setSnackbar(null)}
              className="ml-2 opacity-70 hover:opacity-100"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
