-- ==========================================
-- VERGER & COM - Migration Sécurité Production
-- ==========================================
-- Corrige les avertissements du linter Supabase :
-- 1. function_search_path_mutable
-- 2. rls_policy_always_true

-- ==========================================
-- 1. FONCTIONS - Fixer le search_path
-- ==========================================

ALTER FUNCTION IF EXISTS get_next_delivery_date() SET search_path = public;
ALTER FUNCTION IF EXISTS get_next_delivery_date_for_day(text) SET search_path = public;
ALTER FUNCTION IF EXISTS update_updated_at_column() SET search_path = public;

-- ==========================================
-- 2. RLS POLICIES - Remplacer "Allow all for dev"
-- ==========================================

-- === USERS ===
DROP POLICY IF EXISTS "Allow all for dev" ON users;
-- Lecture : utilisateur peut voir son propre profil
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (
    email = current_setting('request.jwt.claims', true)::json->>'email'
    OR current_setting('role', true) = 'service_role'
  );
-- Écriture : service_role uniquement
CREATE POLICY "Service role can manage users" ON users
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- === COMPANIES ===
DROP POLICY IF EXISTS "Allow all for dev" ON companies;
-- Lecture : entreprise liée à l'utilisateur
CREATE POLICY "Users can view own company" ON companies
  FOR SELECT USING (
    id IN (SELECT company_id FROM users WHERE email = current_setting('request.jwt.claims', true)::json->>'email')
    OR current_setting('role', true) = 'service_role'
  );
-- Écriture : service_role uniquement
CREATE POLICY "Service role can manage companies" ON companies
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- === ORDERS ===
DROP POLICY IF EXISTS "Allow all for dev" ON orders;
-- Lecture : client peut voir ses propres commandes
CREATE POLICY "Customers can view own orders" ON orders
  FOR SELECT USING (
    customer_email = current_setting('request.jwt.claims', true)::json->>'email'
    OR current_setting('role', true) = 'service_role'
  );
-- Écriture : service_role uniquement
CREATE POLICY "Service role can manage orders" ON orders
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- === ORDER_ITEMS ===
DROP POLICY IF EXISTS "Allow all for dev" ON order_items;
-- Lecture : liée aux orders accessibles
CREATE POLICY "Customers can view own order items" ON order_items
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM orders
      WHERE customer_email = current_setting('request.jwt.claims', true)::json->>'email'
    )
    OR current_setting('role', true) = 'service_role'
  );
-- Écriture : service_role uniquement
CREATE POLICY "Service role can manage order items" ON order_items
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- === SUBSCRIPTIONS ===
DROP POLICY IF EXISTS "Allow all for dev" ON subscriptions;
-- Lecture : client peut voir ses abonnements
CREATE POLICY "Customers can view own subscriptions" ON subscriptions
  FOR SELECT USING (
    customer_email = current_setting('request.jwt.claims', true)::json->>'email'
    OR current_setting('role', true) = 'service_role'
  );
-- Écriture : service_role uniquement
CREATE POLICY "Service role can manage subscriptions" ON subscriptions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- === SAVED_BASKETS ===
DROP POLICY IF EXISTS "Allow all for dev" ON saved_baskets;
-- Lecture/écriture : utilisateur peut gérer ses paniers sauvegardés
CREATE POLICY "Users can manage own saved baskets" ON saved_baskets
  FOR ALL USING (
    user_id IN (SELECT id FROM users WHERE email = current_setting('request.jwt.claims', true)::json->>'email')
    OR current_setting('role', true) = 'service_role'
  ) WITH CHECK (
    user_id IN (SELECT id FROM users WHERE email = current_setting('request.jwt.claims', true)::json->>'email')
    OR current_setting('role', true) = 'service_role'
  );

-- === DRIVERS ===
DROP POLICY IF EXISTS "Allow all for dev" ON drivers;
-- Lecture : publique (pour afficher les livreurs disponibles)
CREATE POLICY "Anyone can view active drivers" ON drivers
  FOR SELECT USING (is_active = true OR current_setting('role', true) = 'service_role');
-- Écriture : service_role uniquement
CREATE POLICY "Service role can manage drivers" ON drivers
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- === DRIVER_INVITE_TOKENS ===
DROP POLICY IF EXISTS "Allow all for dev" ON driver_invite_tokens;
-- Accès : service_role uniquement (tokens sensibles)
CREATE POLICY "Service role only for invite tokens" ON driver_invite_tokens
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- === TELEGRAM_NOTIFICATIONS ===
DROP POLICY IF EXISTS "Allow all for dev" ON telegram_notifications;
-- Accès : service_role uniquement
CREATE POLICY "Service role only for telegram notifications" ON telegram_notifications
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- === EMAIL_VERIFICATION_CODES ===
DROP POLICY IF EXISTS "Allow all for dev" ON email_verification_codes;
DROP POLICY IF EXISTS "Service role has full access" ON email_verification_codes;
-- Accès : service_role uniquement (codes sensibles)
CREATE POLICY "Service role only for verification codes" ON email_verification_codes
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- === PROMO_CODES ===
DROP POLICY IF EXISTS "Anyone can read active promo codes" ON promo_codes;
DROP POLICY IF EXISTS "Service role has full access to promo_codes" ON promo_codes;
-- Lecture : publique pour codes actifs (validation côté client)
CREATE POLICY "Anyone can validate active promo codes" ON promo_codes
  FOR SELECT USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));
-- Écriture : service_role uniquement
CREATE POLICY "Service role can manage promo codes" ON promo_codes
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- === PROMO_CODE_USES ===
DROP POLICY IF EXISTS "Service role has full access to promo_code_uses" ON promo_code_uses;
-- Accès : service_role uniquement
CREATE POLICY "Service role only for promo code uses" ON promo_code_uses
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ==========================================
-- FIN MIGRATION SÉCURITÉ
-- ==========================================
