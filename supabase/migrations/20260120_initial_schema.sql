-- ==========================================
-- VERGER & COM - Schéma de Base de Données
-- ==========================================
-- Exécuter ce script dans l'éditeur SQL de Supabase

-- === ENUMS ===
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'preparing', 'delivered', 'cancelled');
CREATE TYPE subscription_frequency AS ENUM ('weekly', 'biweekly', 'monthly');
CREATE TYPE product_type AS ENUM ('basket', 'juice', 'dried');

-- === TABLE: ENTREPRISES ===
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  address TEXT NOT NULL,
  siret TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche rapide par email
CREATE INDEX idx_companies_email ON companies(email);

-- === TABLE: COMMANDES ===
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  status order_status DEFAULT 'pending',
  subtotal DECIMAL(10,2) NOT NULL,
  delivery_fee DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  is_subscription BOOLEAN DEFAULT FALSE,
  subscription_frequency subscription_frequency,
  delivery_date DATE NOT NULL,
  delivery_address TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les commandes par entreprise et par date
CREATE INDEX idx_orders_company ON orders(company_id);
CREATE INDEX idx_orders_delivery_date ON orders(delivery_date);
CREATE INDEX idx_orders_status ON orders(status);

-- === TABLE: ARTICLES DE COMMANDE ===
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_type product_type NOT NULL,
  product_id TEXT NOT NULL, -- ID du produit (basket-5kg, jus-25cl-orange, etc.)
  quantity INTEGER DEFAULT 1,
  is_custom BOOLEAN DEFAULT FALSE,
  custom_basket_data JSONB, -- Données du panier personnalisé
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);

-- === TABLE: ABONNEMENTS ===
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  frequency subscription_frequency NOT NULL,
  default_order_data JSONB NOT NULL, -- Configuration par défaut de la commande
  next_delivery_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_company ON subscriptions(company_id);
CREATE INDEX idx_subscriptions_active ON subscriptions(is_active) WHERE is_active = TRUE;

-- === TABLE: PANIERS SAUVEGARDÉS ===
CREATE TABLE saved_baskets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  basket_size_id TEXT NOT NULL, -- basket-5kg, basket-8kg, basket-12kg
  items_data JSONB NOT NULL, -- [{fruitId, quantity}]
  total_weight DECIMAL(10,2) NOT NULL,
  calculated_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_saved_baskets_company ON saved_baskets(company_id);

-- === TRIGGERS: Mise à jour automatique de updated_at ===
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- === RLS (Row Level Security) ===
-- Active RLS sur toutes les tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_baskets ENABLE ROW LEVEL SECURITY;

-- Policies pour les entreprises (les utilisateurs ne voient que leur entreprise)
-- Note: À configurer selon votre logique d'authentification
-- Exemple avec auth.uid() lié à company_id via une table de liaison

-- Policy temporaire: permet tout pour le développement
-- À REMPLACER par des policies restrictives en production
CREATE POLICY "Allow all for dev" ON companies FOR ALL USING (true);
CREATE POLICY "Allow all for dev" ON orders FOR ALL USING (true);
CREATE POLICY "Allow all for dev" ON order_items FOR ALL USING (true);
CREATE POLICY "Allow all for dev" ON subscriptions FOR ALL USING (true);
CREATE POLICY "Allow all for dev" ON saved_baskets FOR ALL USING (true);

-- === FONCTIONS UTILITAIRES ===

-- Fonction pour calculer le prochain jour de livraison
CREATE OR REPLACE FUNCTION get_next_delivery_date(frequency subscription_frequency, from_date DATE DEFAULT CURRENT_DATE)
RETURNS DATE AS $$
BEGIN
  CASE frequency
    WHEN 'weekly' THEN
      RETURN from_date + INTERVAL '7 days';
    WHEN 'biweekly' THEN
      RETURN from_date + INTERVAL '14 days';
    WHEN 'monthly' THEN
      RETURN from_date + INTERVAL '1 month';
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- === DONNÉES DE TEST (optionnel) ===
-- Décommenter pour insérer des données de test

/*
INSERT INTO companies (name, email, phone, address, siret) VALUES
  ('Startup Paris', 'contact@startup-paris.fr', '01 23 45 67 89', '42 Rue de la Tech, 75001 Paris', '12345678901234'),
  ('Agency Digital', 'hello@agency.io', '01 98 76 54 32', '15 Avenue du Web, 75002 Paris', '98765432109876');
*/
