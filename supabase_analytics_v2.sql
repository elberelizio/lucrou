-- Analytics v2: eventos, IP, tempo em páginas (executar no SQL Editor do Supabase)

ALTER TABLE sessoes
  ADD COLUMN IF NOT EXISTS ip_address TEXT,
  ADD COLUMN IF NOT EXISTS pais TEXT,
  ADD COLUMN IF NOT EXISTS referrer TEXT,
  ADD COLUMN IF NOT EXISTS largura_ecra INTEGER;

CREATE TABLE IF NOT EXISTS eventos_analytics (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id  TEXT NOT NULL,
  tipo        TEXT NOT NULL, -- page_view | click | feature | session_end
  pagina      TEXT,
  acao        TEXT,
  detalhes    JSONB DEFAULT '{}',
  ip_address  TEXT,
  criado_em   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_eventos_visitor ON eventos_analytics(visitor_id);
CREATE INDEX IF NOT EXISTS idx_eventos_tipo ON eventos_analytics(tipo);
CREATE INDEX IF NOT EXISTS idx_eventos_criado ON eventos_analytics(criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_eventos_pagina ON eventos_analytics(pagina);

ALTER TABLE eventos_analytics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "eventos_service_only" ON eventos_analytics;
CREATE POLICY "eventos_service_only" ON eventos_analytics
  FOR ALL USING (auth.role() = 'service_role');
