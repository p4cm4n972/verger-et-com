-- Table des codes promo
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) UNIQUE NOT NULL,
  discount_type VARCHAR(10) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL CHECK (discount_value > 0),
  description TEXT,
  max_uses INTEGER DEFAULT NULL, -- NULL = illimité
  current_uses INTEGER DEFAULT 0,
  min_order_amount DECIMAL(10,2) DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL, -- NULL = pas d'expiration
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Index pour recherche rapide par code
CREATE INDEX idx_promo_codes_code ON promo_codes(code);
CREATE INDEX idx_promo_codes_active ON promo_codes(is_active, expires_at);

-- Table pour tracker l'utilisation des codes (optionnel, pour éviter réutilisation par même client)
CREATE TABLE IF NOT EXISTS promo_code_uses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id UUID NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  customer_email VARCHAR(255) NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_promo_code_uses_email ON promo_code_uses(customer_email);
CREATE INDEX idx_promo_code_uses_code ON promo_code_uses(promo_code_id);

-- Ajouter colonne promo_code à la table orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS promo_code VARCHAR(20) DEFAULT NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0;

-- RLS policies
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_code_uses ENABLE ROW LEVEL SECURITY;

-- Politique: lecture publique pour codes actifs (validation)
CREATE POLICY "Anyone can read active promo codes" ON promo_codes
  FOR SELECT USING (is_active = true);

-- Politique: admin peut tout faire (via service role)
CREATE POLICY "Service role has full access to promo_codes" ON promo_codes
  FOR ALL USING (true);

CREATE POLICY "Service role has full access to promo_code_uses" ON promo_code_uses
  FOR ALL USING (true);
