-- Fix RLS Policy para codigos_ativacao
-- Execute este SQL no Supabase Dashboard → SQL Editor

-- Remover política se já existir (para evitar erro)
DROP POLICY IF EXISTS "Permitir inserção de códigos" ON codigos_ativacao;

-- Adicionar política de INSERT que estava em falta
CREATE POLICY "Permitir inserção de códigos"
  ON codigos_ativacao FOR INSERT
  WITH CHECK (true);
