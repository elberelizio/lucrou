-- =============================================
-- LUCROU — Correcção completa de políticas RLS
-- Executar no Supabase Dashboard → SQL Editor
-- =============================================
-- ATENÇÃO: Este SQL remove TODAS as políticas existentes
-- e substitui por políticas seguras.
-- Após executar, NENHUMA leitura/escrita anónima directa
-- é possível — tudo passa pelas API routes (service_role).

-- ============ TABELA: usuarios ============
DROP POLICY IF EXISTS "Utilizadores podem ler seus próprios dados" ON usuarios;
DROP POLICY IF EXISTS "Utilizadores podem inserir seus próprios dados" ON usuarios;
DROP POLICY IF EXISTS "Utilizadores podem atualizar seus próprios dados" ON usuarios;
DROP POLICY IF EXISTS "usuarios_select_own" ON usuarios;
DROP POLICY IF EXISTS "usuarios_insert_service" ON usuarios;
DROP POLICY IF EXISTS "usuarios_update_own" ON usuarios;

-- SELECT: utilizador autenticado vê só os seus dados (por auth.uid = id)
-- service_role bypassa RLS automaticamente
CREATE POLICY "usuarios_select_own" ON usuarios
  FOR SELECT USING (
    auth.uid() = id
  );

-- INSERT: apenas service_role (via API routes do servidor)
CREATE POLICY "usuarios_insert_service" ON usuarios
  FOR INSERT WITH CHECK (
    auth.role() = 'service_role'
  );

-- UPDATE: utilizador autenticado actualiza só os seus dados
CREATE POLICY "usuarios_update_own" ON usuarios
  FOR UPDATE USING (
    auth.uid() = id OR auth.role() = 'service_role'
  );

-- ============ TABELA: calculos ============
DROP POLICY IF EXISTS "Utilizadores podem ler seus próprios cálculos" ON calculos;
DROP POLICY IF EXISTS "Utilizadores podem inserir seus próprios cálculos" ON calculos;
DROP POLICY IF EXISTS "calculos_select_own" ON calculos;
DROP POLICY IF EXISTS "calculos_insert_service" ON calculos;
DROP POLICY IF EXISTS "calculos_update_service" ON calculos;
DROP POLICY IF EXISTS "calculos_delete_own" ON calculos;

-- SELECT: utilizador vê só os seus cálculos
CREATE POLICY "calculos_select_own" ON calculos
  FOR SELECT USING (
    auth.uid() = usuario_id OR auth.role() = 'service_role'
  );

-- INSERT: apenas service_role (API routes)
CREATE POLICY "calculos_insert_service" ON calculos
  FOR INSERT WITH CHECK (
    auth.role() = 'service_role'
  );

-- UPDATE: apenas service_role
CREATE POLICY "calculos_update_service" ON calculos
  FOR UPDATE USING (
    auth.role() = 'service_role'
  );

-- DELETE: utilizador pode apagar os seus cálculos
CREATE POLICY "calculos_delete_own" ON calculos
  FOR DELETE USING (
    auth.uid() = usuario_id OR auth.role() = 'service_role'
  );

-- ============ TABELA: pagamentos ============
DROP POLICY IF EXISTS "Utilizadores podem ler seus próprios pagamentos" ON pagamentos;
DROP POLICY IF EXISTS "Utilizadores podem inserir seus próprios pagamentos" ON pagamentos;
DROP POLICY IF EXISTS "Administradores podem atualizar pagamentos" ON pagamentos;
DROP POLICY IF EXISTS "pagamentos_select_own" ON pagamentos;
DROP POLICY IF EXISTS "pagamentos_insert_service" ON pagamentos;
DROP POLICY IF EXISTS "pagamentos_update_service" ON pagamentos;

-- SELECT: utilizador vê só os seus pagamentos
CREATE POLICY "pagamentos_select_own" ON pagamentos
  FOR SELECT USING (
    auth.uid() = usuario_id OR auth.role() = 'service_role'
  );

-- INSERT/UPDATE: apenas service_role
CREATE POLICY "pagamentos_insert_service" ON pagamentos
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "pagamentos_update_service" ON pagamentos
  FOR UPDATE USING (auth.role() = 'service_role');

-- ============ TABELA: codigos_ativacao ============
DROP POLICY IF EXISTS "Permitir leitura de códigos para validação" ON codigos_ativacao;
DROP POLICY IF EXISTS "Permitir inserção de códigos" ON codigos_ativacao;
DROP POLICY IF EXISTS "Permitir atualização de códigos via função" ON codigos_ativacao;
DROP POLICY IF EXISTS "codigos_service_only" ON codigos_ativacao;

-- Apenas service_role acede a esta tabela (via API routes)
-- Nenhum utilizador anon ou autenticado normal deve aceder directamente
CREATE POLICY "codigos_service_only" ON codigos_ativacao
  FOR ALL USING (auth.role() = 'service_role');

-- ============ VERIFICAÇÃO ============
-- Execute esta query para confirmar que as políticas foram criadas:
-- SELECT tablename, policyname, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;
