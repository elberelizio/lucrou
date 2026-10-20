-- Tabela para códigos de ativação M-Pesa
CREATE TABLE IF NOT EXISTS codigos_ativacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT UNIQUE NOT NULL,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  usado BOOLEAN DEFAULT FALSE,
  usado_em TIMESTAMP,
  criado_em TIMESTAMP DEFAULT NOW(),
  expira_em TIMESTAMP -- Código expira após X dias se não usado
);

-- Adicionar campo de validade do premium na tabela usuarios
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS premium_valido_ate TIMESTAMP;

-- Índices
CREATE INDEX IF NOT EXISTS idx_codigos_ativacao_codigo ON codigos_ativacao(codigo);
CREATE INDEX IF NOT EXISTS idx_codigos_ativacao_usado ON codigos_ativacao(usado);
CREATE INDEX IF NOT EXISTS idx_usuarios_premium_valido_ate ON usuarios(premium_valido_ate);

-- Função para validar e ativar código
CREATE OR REPLACE FUNCTION ativar_codigo_premium(
  p_codigo TEXT,
  p_usuario_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_codigo_record codigos_ativacao%ROWTYPE;
  v_result JSON;
BEGIN
  -- Buscar código
  SELECT * INTO v_codigo_record
  FROM codigos_ativacao
  WHERE codigo = p_codigo;

  -- Verificar se código existe
  IF NOT FOUND THEN
    RETURN json_build_object(
      'sucesso', false,
      'mensagem', 'Código inválido'
    );
  END IF;

  -- Verificar se já foi usado
  IF v_codigo_record.usado THEN
    RETURN json_build_object(
      'sucesso', false,
      'mensagem', 'Este código já foi utilizado'
    );
  END IF;

  -- Verificar se expirou
  IF v_codigo_record.expira_em IS NOT NULL AND v_codigo_record.expira_em < NOW() THEN
    RETURN json_build_object(
      'sucesso', false,
      'mensagem', 'Este código expirou'
    );
  END IF;

  -- Marcar código como usado
  UPDATE codigos_ativacao
  SET usado = TRUE,
      usado_em = NOW(),
      usuario_id = p_usuario_id
  WHERE id = v_codigo_record.id;

  -- Ativar premium por 30 dias
  UPDATE usuarios
  SET plano = 'premium',
      premium_valido_ate = NOW() + INTERVAL '30 days'
  WHERE id = p_usuario_id;

  RETURN json_build_object(
    'sucesso', true,
    'mensagem', 'Premium activado por 30 dias',
    'valido_ate', (NOW() + INTERVAL '30 days')::TEXT
  );
END;
$$;

-- Função para verificar e reverter expirações (executar diariamente)
CREATE OR REPLACE FUNCTION verificar_expiracoes_premium()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Reverter para gratuito utilizadores cujo premium expirou
  UPDATE usuarios
  SET plano = 'gratuito',
      premium_valido_ate = NULL
  WHERE plano = 'premium'
    AND premium_valido_ate IS NOT NULL
    AND premium_valido_ate < NOW();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Política RLS para codigos_ativacao
ALTER TABLE codigos_ativacao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura de códigos para validação"
  ON codigos_ativacao FOR SELECT
  USING (true);

CREATE POLICY "Permitir inserção de códigos"
  ON codigos_ativacao FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Permitir atualização de códigos via função"
  ON codigos_ativacao FOR UPDATE
  USING (true);
