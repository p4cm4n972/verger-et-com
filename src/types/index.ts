// ==========================================
// VERGER & COM - Types
// ==========================================

// === PANIERS DE FRUITS ===
export interface BasketSize {
  id: string;
  name: string;
  weight: number; // en kg
  persons: number;
  price: number; // prix de vente
  costPrice: number; // prix de revient
  description: string;
}

// === FRUITS ===
export interface Fruit {
  id: string;
  name: string;
  emoji: string;
  category: 'red' | 'orange' | 'yellow' | 'green';
  pricePerKg: number; // prix au kg
  costPerKg: number; // coût au kg
  season: number[]; // mois de saison (1-12)
  image?: string;
}

// === JUS DE FRUITS ===
export interface Juice {
  id: string;
  name: string;
  flavor: string;
  emoji: string;
  size: '25cl' | '1L';
  quantity: number; // 12 pour 25cl, 6 pour 1L
  price: number;
  costPrice: number;
  image?: string;
}

// === FRUITS SECS ===
export interface DriedFruit {
  id: string;
  name: string;
  weight: number; // en grammes
  persons: number;
  price: number;
  costPrice: number;
  image?: string;
}

// === PANIER COMPOSÉ (CUSTOM) ===
export interface CustomBasketItem {
  fruit: Fruit;
  quantity: number; // en kg
}

export interface CustomBasket {
  baseSize: BasketSize;
  items: CustomBasketItem[];
  totalWeight: number;
  calculatedPrice: number;
}

// === COMMANDE ===
export interface OrderItem {
  type: 'basket' | 'juice' | 'dried';
  productId: string;
  quantity: number;
  isCustom: boolean;
  customBasket?: CustomBasket;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  companyId: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  isSubscription: boolean;
  subscriptionFrequency?: 'weekly' | 'biweekly' | 'monthly';
  deliveryDate: string;
  deliveryAddress: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'delivered' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

// === ENTREPRISE ===
export interface Company {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  siret?: string;
  createdAt: string;
}

// === ABONNEMENT ===
export interface Subscription {
  id: string;
  companyId: string;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  defaultOrder: OrderItem[];
  nextDeliveryDate: string;
  isActive: boolean;
  createdAt: string;
}
