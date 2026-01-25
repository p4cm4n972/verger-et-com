-- ==========================================
-- VERGER & COM - Tokens d'invitation livreur
-- ==========================================

CREATE TABLE driver_invite_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  used_by_user_id UUID REFERENCES users(id)
);

CREATE INDEX idx_invite_tokens_token ON driver_invite_tokens(token);
CREATE INDEX idx_invite_tokens_expires ON driver_invite_tokens(expires_at);

-- Policy pour permettre l'accès
ALTER TABLE driver_invite_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for dev" ON driver_invite_tokens FOR ALL USING (true);
