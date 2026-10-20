-- Avaliações da app (executar no SQL Editor do Supabase)

CREATE TABLE IF NOT EXISTS avaliacoes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id  TEXT,
  usuario_id  UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  estrelas    SMALLINT NOT NULL CHECK (estrelas >= 1 AND estrelas <= 5),
  ip_address  TEXT,
  criado_em   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_avaliacoes_criado ON avaliacoes(criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_estrelas ON avaliacoes(estrelas);

ALTER TABLE avaliacoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "avaliacoes_service_only" ON avaliacoes;
CREATE POLICY "avaliacoes_service_only" ON avaliacoes
  FOR ALL USING (auth.role() = 'service_role');
