// ==========================================
// VERGER & COM - Database Types (Supabase)
// ==========================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      // === ENTREPRISES ===
      companies: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          address: string;
          siret: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          phone?: string | null;
          address: string;
          siret?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          phone?: string | null;
          address?: string;
          siret?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };

      // === COMMANDES ===
      orders: {
        Row: {
          id: string;
          company_id: string;
          status: 'pending' | 'confirmed' | 'preparing' | 'delivered' | 'cancelled';
          subtotal: number;
          delivery_fee: number;
          total: number;
          is_subscription: boolean;
          subscription_frequency: 'weekly' | 'biweekly' | 'monthly' | null;
          delivery_date: string;
          delivery_address: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          status?: 'pending' | 'confirmed' | 'preparing' | 'delivered' | 'cancelled';
          subtotal: number;
          delivery_fee?: number;
          total: number;
          is_subscription?: boolean;
          subscription_frequency?: 'weekly' | 'biweekly' | 'monthly' | null;
          delivery_date: string;
          delivery_address: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          status?: 'pending' | 'confirmed' | 'preparing' | 'delivered' | 'cancelled';
          subtotal?: number;
          delivery_fee?: number;
          total?: number;
          is_subscription?: boolean;
          subscription_frequency?: 'weekly' | 'biweekly' | 'monthly' | null;
          delivery_date?: string;
          delivery_address?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };

      // === ARTICLES DE COMMANDE ===
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_type: 'basket' | 'juice' | 'dried';
          product_id: string;
          quantity: number;
          is_custom: boolean;
          custom_basket_data: Json | null;
          unit_price: number;
          total_price: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_type: 'basket' | 'juice' | 'dried';
          product_id: string;
          quantity?: number;
          is_custom?: boolean;
          custom_basket_data?: Json | null;
          unit_price: number;
          total_price: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_type?: 'basket' | 'juice' | 'dried';
          product_id?: string;
          quantity?: number;
          is_custom?: boolean;
          custom_basket_data?: Json | null;
          unit_price?: number;
          total_price?: number;
          created_at?: string;
        };
      };

      // === ABONNEMENTS ===
      subscriptions: {
        Row: {
          id: string;
          company_id: string;
          frequency: 'weekly' | 'biweekly' | 'monthly';
          default_order_data: Json;
          next_delivery_date: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          frequency: 'weekly' | 'biweekly' | 'monthly';
          default_order_data: Json;
          next_delivery_date: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          frequency?: 'weekly' | 'biweekly' | 'monthly';
          default_order_data?: Json;
          next_delivery_date?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };

      // === PANIERS SAUVEGARDÉS ===
      saved_baskets: {
        Row: {
          id: string;
          company_id: string;
          name: string;
          basket_size_id: string;
          items_data: Json;
          total_weight: number;
          calculated_price: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          name: string;
          basket_size_id: string;
          items_data: Json;
          total_weight: number;
          calculated_price: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          name?: string;
          basket_size_id?: string;
          items_data?: Json;
          total_weight?: number;
          calculated_price?: number;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      order_status: 'pending' | 'confirmed' | 'preparing' | 'delivered' | 'cancelled';
      subscription_frequency: 'weekly' | 'biweekly' | 'monthly';
      product_type: 'basket' | 'juice' | 'dried';
    };
  };
}

// Types utilitaires
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

// Types spécifiques pour faciliter l'utilisation
export type Company = Tables<'companies'>;
export type Order = Tables<'orders'>;
export type OrderItem = Tables<'order_items'>;
export type Subscription = Tables<'subscriptions'>;
export type SavedBasket = Tables<'saved_baskets'>;
