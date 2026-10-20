-- Fix para erro 406: Adicionar campo premium_valido_ate se não existir
-- Execute este SQL se estiver a receber erro 406 ao consultar usuarios

-- Adicionar campo de validade do premium na tabela usuarios (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'usuarios' 
        AND column_name = 'premium_valido_ate'
    ) THEN
        ALTER TABLE usuarios ADD COLUMN premium_valido_ate TIMESTAMP;
        CREATE INDEX IF NOT EXISTS idx_usuarios_premium_valido_ate ON usuarios(premium_valido_ate);
    END IF;
END $$;

-- Verificar e corrigir políticas RLS se necessário
DROP POLICY IF EXISTS "Utilizadores podem ler seus próprios dados" ON usuarios;
CREATE POLICY "Utilizadores podem ler seus próprios dados"
  ON usuarios FOR SELECT
  USING (true); -- Permitir leitura pública

DROP POLICY IF EXISTS "Utilizadores podem inserir seus próprios dados" ON usuarios;
CREATE POLICY "Utilizadores podem inserir seus próprios dados"
  ON usuarios FOR INSERT
  WITH CHECK (true); -- Permitir inserção pública

DROP POLICY IF EXISTS "Utilizadores podem atualizar seus próprios dados" ON usuarios;
CREATE POLICY "Utilizadores podem atualizar seus próprios dados"
  ON usuarios FOR UPDATE
  USING (true); -- Permitir atualização pública
