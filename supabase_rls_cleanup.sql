-- =============================================
-- LUCROU — Remover políticas antigas (limpeza)
-- Executar no Supabase Dashboard → SQL Editor
-- =============================================

DROP POLICY IF EXISTS "usuario ve so os seus calculos" ON calculos;
DROP POLICY IF EXISTS "usuario ve so os seus pagamentos" ON pagamentos;
DROP POLICY IF EXISTS "usuario ve so os seus dados" ON usuarios;

-- Verificar resultado final (deve ter exactamente 11 políticas):
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
