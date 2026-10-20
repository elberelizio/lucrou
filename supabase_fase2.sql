-- =============================================
-- LUCROU — Schema Fase 2: Stock + Resumo Mensal
-- Executar no Supabase Dashboard → SQL Editor
-- =============================================

-- 1. Campo preco_atual_cobrado nos cálculos (Modo B)
ALTER TABLE calculos
ADD COLUMN IF NOT EXISTS preco_atual_cobrado NUMERIC;

COMMENT ON COLUMN calculos.preco_atual_cobrado IS
'Preço actual cobrado pelo utilizador no Modo B. NULL para Modo A.';

-- 2. Campo stock_atual nos cálculos
ALTER TABLE calculos
ADD COLUMN IF NOT EXISTS stock_atual INTEGER DEFAULT 0;

COMMENT ON COLUMN calculos.stock_atual IS
'Stock actual disponível para este produto. Actualizado via movimentos_stock.';

-- 3. Tabela de movimentos de stock
CREATE TABLE IF NOT EXISTS movimentos_stock (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calculo_id   UUID NOT NULL REFERENCES calculos(id) ON DELETE CASCADE,
  usuario_id   UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo         TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  quantidade   INTEGER NOT NULL CHECK (quantidade > 0),
  observacao   TEXT,
  criado_em    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_movimentos_calculo_id ON movimentos_stock(calculo_id);
CREATE INDEX IF NOT EXISTS idx_movimentos_usuario_id ON movimentos_stock(usuario_id);
CREATE INDEX IF NOT EXISTS idx_movimentos_criado_em  ON movimentos_stock(criado_em DESC);

-- Índice composto para resumo mensal
CREATE INDEX IF NOT EXISTS idx_calculos_usuario_mes
  ON calculos(usuario_id, criado_em DESC);

-- 4. RLS para movimentos_stock
ALTER TABLE movimentos_stock ENABLE ROW LEVEL SECURITY;

CREATE POLICY "movimentos_select_own" ON movimentos_stock
  FOR SELECT USING (auth.uid() = usuario_id OR auth.role() = 'service_role');

CREATE POLICY "movimentos_insert_service" ON movimentos_stock
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "movimentos_delete_own" ON movimentos_stock
  FOR DELETE USING (auth.uid() = usuario_id OR auth.role() = 'service_role');
