-- Tabela de sessões anónimas
CREATE TABLE IF NOT EXISTS sessoes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id       TEXT NOT NULL, -- UUID gerado no browser
  usuario_id       UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  primeiro_acesso  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ultimo_acesso    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_calculos   INTEGER DEFAULT 0,
  dispositivo      TEXT, -- 'mobile' ou 'desktop'
  user_agent       TEXT
);

CREATE INDEX IF NOT EXISTS idx_sessoes_visitor_id ON sessoes(visitor_id);
CREATE INDEX IF NOT EXISTS idx_sessoes_primeiro_acesso ON sessoes(primeiro_acesso DESC);

ALTER TABLE sessoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sessoes_service_only" ON sessoes;
CREATE POLICY "sessoes_service_only" ON sessoes
  FOR ALL USING (auth.role() = 'service_role');

-- Tornar usuario_id e email_usuario opcionais na tabela calculos
ALTER TABLE calculos
  ALTER COLUMN usuario_id DROP NOT NULL,
  ALTER COLUMN email_usuario DROP NOT NULL;

-- Adicionar visitor_id aos cálculos anónimos
ALTER TABLE calculos
  ADD COLUMN IF NOT EXISTS visitor_id TEXT,
  ADD COLUMN IF NOT EXISTS guardado BOOLEAN DEFAULT FALSE;

-- Índices para analytics
CREATE INDEX IF NOT EXISTS idx_calculos_visitor_id ON calculos(visitor_id);
CREATE INDEX IF NOT EXISTS idx_calculos_guardado ON calculos(guardado);
CREATE INDEX IF NOT EXISTS idx_calculos_anonimo ON calculos(criado_em DESC)
  WHERE usuario_id IS NULL;

COMMENT ON COLUMN calculos.visitor_id IS
  'UUID anónimo do browser. NULL se utilizador autenticado.';
COMMENT ON COLUMN calculos.guardado IS
  'TRUE se o utilizador guardou explicitamente. FALSE se foi guardado automaticamente para analytics.';

CREATE OR REPLACE FUNCTION incrementar_calculos_sessao(p_visitor_id TEXT)
RETURNS void AS $$
BEGIN
  UPDATE sessoes
  SET total_calculos = total_calculos + 1,
      ultimo_acesso = NOW()
  WHERE visitor_id = p_visitor_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
