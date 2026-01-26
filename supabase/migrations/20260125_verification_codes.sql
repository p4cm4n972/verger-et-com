-- ==========================================
-- VERGER & COM - Codes de vérification email
-- ==========================================

CREATE TABLE email_verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  attempts INTEGER DEFAULT 0
);

CREATE INDEX idx_verification_codes_email ON email_verification_codes(email);
CREATE INDEX idx_verification_codes_expires ON email_verification_codes(expires_at);

-- Nettoyage automatique des codes expirés (à exécuter via cron)
-- DELETE FROM email_verification_codes WHERE expires_at < NOW();

-- RLS
ALTER TABLE email_verification_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for dev" ON email_verification_codes FOR ALL USING (true);
