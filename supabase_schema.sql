-- Tabela usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  nome TEXT,
  nome_negocio TEXT,
  plano TEXT DEFAULT 'gratuito' CHECK (plano IN ('gratuito', 'premium', 'pendente_premium')),
  criado_em TIMESTAMP DEFAULT NOW(),
  ultimo_acesso TIMESTAMP
);

-- Tabela calculos
CREATE TABLE IF NOT EXISTS calculos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  email_usuario TEXT NOT NULL,
  nome_produto TEXT NOT NULL,
  unidades INTEGER NOT NULL,
  preco_compra NUMERIC NOT NULL,
  custo_transporte NUMERIC NOT NULL,
  outros_custos NUMERIC NOT NULL,
  lucro_percent NUMERIC NOT NULL,
  preco_recomendado NUMERIC NOT NULL,
  lucro_por_unidade NUMERIC NOT NULL,
  lucro_total NUMERIC NOT NULL,
  modo TEXT NOT NULL CHECK (modo IN ('modoA', 'modoB')),
  criado_em TIMESTAMP DEFAULT NOW()
);

-- Tabela pagamentos
CREATE TABLE IF NOT EXISTS pagamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  valor NUMERIC DEFAULT 50,
  referencia_mpesa TEXT,
  estado TEXT DEFAULT 'pendente' CHECK (estado IN ('pendente', 'confirmado', 'cancelado')),
  criado_em TIMESTAMP DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_calculos_usuario_id ON calculos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_calculos_email_usuario ON calculos(email_usuario);
CREATE INDEX IF NOT EXISTS idx_calculos_criado_em ON calculos(criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_pagamentos_usuario_id ON pagamentos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_estado ON pagamentos(estado);

-- RLS (Row Level Security)
-- IMPORTANTE: NÃO usar USING (true). As policies seguras estão em supabase_rls_fix.sql
-- Após criar as tabelas, execute também: supabase_rls_fix.sql
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE calculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagamentos ENABLE ROW LEVEL SECURITY;

-- Policies temporárias seguras (substituídas/alinhadas por supabase_rls_fix.sql)
CREATE POLICY "usuarios_select_own" ON usuarios
  FOR SELECT USING ((select auth.uid()) = id);

CREATE POLICY "usuarios_insert_service" ON usuarios
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "usuarios_update_own" ON usuarios
  FOR UPDATE USING ((select auth.uid()) = id);

CREATE POLICY "calculos_select_own" ON calculos
  FOR SELECT USING ((select auth.uid()) = usuario_id);

CREATE POLICY "calculos_insert_service" ON calculos
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "pagamentos_select_own" ON pagamentos
  FOR SELECT USING ((select auth.uid()) = usuario_id);

CREATE POLICY "pagamentos_insert_service" ON pagamentos
  FOR INSERT WITH CHECK (auth.role() = 'service_role');
