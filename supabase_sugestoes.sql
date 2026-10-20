-- Sugestões dos utilizadores (executar no SQL Editor do Supabase)

CREATE TABLE IF NOT EXISTS sugestoes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id  TEXT,
  texto       TEXT NOT NULL,
  ip_address  TEXT,
  criado_em   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sugestoes_criado ON sugestoes(criado_em DESC);

ALTER TABLE sugestoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sugestoes_service_only" ON sugestoes;
CREATE POLICY "sugestoes_service_only" ON sugestoes
  FOR ALL USING (auth.role() = 'service_role');
