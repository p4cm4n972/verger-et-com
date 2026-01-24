-- ==========================================
-- VERGER & COM - Livreurs & Jours de Livraison
-- ==========================================
-- Migration: Ajout du système de livreurs avec Telegram

-- === NOUVEAUX ENUMS ===
CREATE TYPE user_role AS ENUM ('admin', 'driver', 'client');
CREATE TYPE delivery_day AS ENUM ('monday', 'tuesday');
CREATE TYPE driver_order_status AS ENUM ('pending', 'accepted', 'refused');

-- === TABLE: UTILISATEURS ===
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  role user_role DEFAULT 'client',
  telegram_chat_id TEXT, -- ID Telegram pour les livreurs
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_telegram ON users(telegram_chat_id) WHERE telegram_chat_id IS NOT NULL;

-- === TABLE: LIVREURS (infos supplémentaires) ===
CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  telegram_username TEXT,
  available_monday BOOLEAN DEFAULT TRUE,
  available_tuesday BOOLEAN DEFAULT TRUE,
  max_deliveries_per_day INTEGER DEFAULT 10,
  current_zone TEXT, -- Zone de livraison
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_drivers_user ON drivers(user_id);

-- === MODIFICATION TABLE ORDERS ===
-- Ajouter les nouveaux champs pour la gestion des livreurs

ALTER TABLE orders
ADD COLUMN preferred_delivery_day delivery_day,
ADD COLUMN assigned_driver_id UUID REFERENCES users(id),
ADD COLUMN driver_status driver_order_status DEFAULT 'pending',
ADD COLUMN driver_accepted_at TIMESTAMPTZ,
ADD COLUMN delivered_at TIMESTAMPTZ,
ADD COLUMN customer_email TEXT,
ADD COLUMN customer_phone TEXT;

CREATE INDEX idx_orders_driver ON orders(assigned_driver_id);
CREATE INDEX idx_orders_driver_status ON orders(driver_status);
CREATE INDEX idx_orders_delivery_day ON orders(preferred_delivery_day);

-- === TABLE: NOTIFICATIONS TELEGRAM ===
CREATE TABLE telegram_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES users(id) ON DELETE CASCADE,
  message_id TEXT, -- ID du message Telegram
  status TEXT DEFAULT 'sent', -- sent, accepted, refused, expired
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);

CREATE INDEX idx_telegram_notifications_order ON telegram_notifications(order_id);
CREATE INDEX idx_telegram_notifications_driver ON telegram_notifications(driver_id);

-- === TRIGGERS ===
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drivers_updated_at
  BEFORE UPDATE ON drivers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- === RLS ===
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_notifications ENABLE ROW LEVEL SECURITY;

-- Policies temporaires pour le développement
CREATE POLICY "Allow all for dev" ON users FOR ALL USING (true);
CREATE POLICY "Allow all for dev" ON drivers FOR ALL USING (true);
CREATE POLICY "Allow all for dev" ON telegram_notifications FOR ALL USING (true);

-- === FONCTION: Calculer la prochaine date de livraison ===
CREATE OR REPLACE FUNCTION get_next_delivery_date_for_day(
  preferred_day delivery_day,
  from_date DATE DEFAULT CURRENT_DATE
)
RETURNS DATE AS $$
DECLARE
  target_dow INTEGER;
  current_dow INTEGER;
  days_until INTEGER;
BEGIN
  -- Lundi = 1, Mardi = 2 (format ISO)
  IF preferred_day = 'monday' THEN
    target_dow := 1;
  ELSE
    target_dow := 2;
  END IF;

  current_dow := EXTRACT(ISODOW FROM from_date);

  -- Calculer les jours jusqu'au prochain jour cible
  IF current_dow < target_dow THEN
    days_until := target_dow - current_dow;
  ELSE
    days_until := 7 - current_dow + target_dow;
  END IF;

  -- Si on commande le jour même, prendre la semaine suivante
  IF days_until <= 2 THEN -- Minimum 2 jours de préparation
    days_until := days_until + 7;
  END IF;

  RETURN from_date + days_until;
END;
$$ LANGUAGE plpgsql;

-- === DONNÉES DE TEST: Admin et Livreurs ===
-- Décommenter pour insérer des données de test

/*
-- Admin
INSERT INTO users (email, name, role) VALUES
  ('admin@verger-et-com.fr', 'Admin Verger', 'admin');

-- Livreurs de test
INSERT INTO users (email, name, phone, role, telegram_chat_id) VALUES
  ('livreur1@verger-et-com.fr', 'Jean Livreur', '06 12 34 56 78', 'driver', NULL),
  ('livreur2@verger-et-com.fr', 'Marie Livreuse', '06 98 76 54 32', 'driver', NULL);

-- Infos livreurs
INSERT INTO drivers (user_id, available_monday, available_tuesday, current_zone)
SELECT id, TRUE, TRUE, 'Paris Centre'
FROM users WHERE role = 'driver';
*/
