-- ==========================================
-- VERGER & COM - Photos de preuve de livraison
-- ==========================================
-- Migration: Ajout du support pour les photos de preuve de livraison
-- Les livreurs doivent envoyer une photo via Telegram avant de valider une livraison

-- 1. Ajouter la colonne delivery_proof_url à la table orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_proof_url TEXT;

-- Commentaire pour documentation
COMMENT ON COLUMN orders.delivery_proof_url IS 'URL signée de la photo de preuve de livraison (Supabase Storage)';

-- 2. Créer le bucket storage pour les photos de livraison
-- Note: Cette partie doit être exécutée via l'API Supabase ou le dashboard
-- car la création de bucket n'est pas supportée en SQL standard.
-- Voir les instructions ci-dessous pour la configuration manuelle.

-- Instructions de configuration du bucket (à faire via Dashboard Supabase):
-- 1. Aller dans Storage > Create new bucket
-- 2. Nom: "delivery-photos"
-- 3. Public: NON (bucket privé)
-- 4. File size limit: 5MB
-- 5. Allowed MIME types: image/jpeg, image/png, image/webp

-- 3. Ajouter une policy RLS pour le storage (à configurer via Dashboard)
-- Les policies doivent permettre:
-- - INSERT: uniquement via service_role key (upload côté serveur)
-- - SELECT: via URL signée (générer des URL avec expiration 1 an)

-- 4. Index pour améliorer les requêtes sur les commandes livrées avec photo
CREATE INDEX IF NOT EXISTS idx_orders_delivered_with_photo
ON orders(status, delivered_at)
WHERE status = 'delivered' AND delivery_proof_url IS NOT NULL;
