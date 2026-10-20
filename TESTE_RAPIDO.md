# ⚡ Teste Rápido - Página Admin

## 🚀 Início Rápido (5 minutos)

### 1. Verificar Servidor
```bash
# Se não estiver a correr, inicie:
npm run dev
```

### 2. Configurar Senha Admin

Abra `.env.local` e adicione:
```env
ADMIN_PASSWORD=admin123
```

**Reinicie o servidor** após adicionar!

### 3. Criar Dados de Teste (SQL)

No Supabase Dashboard → SQL Editor, execute:

```sql
-- Criar utilizador de teste com plano pendente
INSERT INTO usuarios (email, nome, nome_negocio, plano)
VALUES ('teste@exemplo.com', 'João Silva', 'Loja Teste', 'pendente_premium')
ON CONFLICT (email) DO UPDATE 
SET plano = 'pendente_premium', 
    nome = 'João Silva',
    nome_negocio = 'Loja Teste';

-- Criar pagamento pendente
INSERT INTO pagamentos (usuario_id, valor, estado)
SELECT id, 50, 'pendente'
FROM usuarios
WHERE email = 'teste@exemplo.com'
ON CONFLICT DO NOTHING;
```

### 4. Testar Página Admin

1. Aceda: `http://localhost:3000/_secret_xyz789`
2. Senha: `admin123`
3. **Deve ver:**
   - Lista com "João Silva" (teste@exemplo.com)
   - Botão "Gerar Código" ao lado

### 5. Gerar Código

1. Clique em "Gerar Código" ao lado do utilizador
2. Copie o código gerado
3. Verifique no Supabase → `codigos_ativacao` que o código existe

### 6. Testar Ativação

1. Abra nova aba: `http://localhost:3000/ativar`
2. Faça login com: `teste@exemplo.com`
3. Digite o código gerado
4. Clique "Activar Premium"
5. **Deve funcionar!** ✅

---

## ✅ Checklist Rápido

- [ ] Servidor a correr
- [ ] Senha admin configurada
- [ ] Dados de teste criados
- [ ] Página admin acessível
- [ ] Lista de pedidos aparece
- [ ] Código gerado com sucesso
- [ ] Código ativa Premium

**Tempo estimado: 5-10 minutos**
