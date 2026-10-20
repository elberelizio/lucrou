# 🔧 Como Desativar Emails de Confirmação do Supabase

## ⚠️ Problema

Quando um utilizador se regista para conta Premium, o Supabase envia automaticamente um email de confirmação. Isso não é necessário porque:

1. O utilizador já está autenticado no sistema (tem email)
2. Não precisamos de confirmação de email
3. O sistema funciona sem autenticação do Supabase Auth

---

## ✅ Solução: Desativar no Dashboard do Supabase

### Passo 1: Aceder às Configurações

1. Aceda ao **Supabase Dashboard**: https://supabase.com/dashboard
2. Selecione o seu projeto
3. Vá para **Authentication** (menu lateral)
4. Clique em **Providers**

### Passo 2: Desativar Confirmação de Email

1. Na secção **"User Signups"**, encontre o toggle **"Confirm email"**
   - Descrição: "Users will need to confirm their email address before signing in for the first time"
   - **Estado atual:** ON (verde) - precisa mudar para OFF
2. **Clique no toggle "Confirm email"** para desativá-lo
   - O toggle mudará de verde (ON) para cinza (OFF)
3. Clique no botão **"Save changes"** (canto inferior direito)

**Pronto!** Agora o Supabase não enviará mais emails de confirmação quando utilizadores se registarem.

---

## 📝 Nota Técnica

O código em `hooks/useAuth.ts` usa `supabase.auth.signUp()` para criar a conta no Supabase Auth. Mesmo que o email de confirmação esteja desativado, o utilizador será criado normalmente.

O sistema funciona principalmente com a tabela `usuarios` e localStorage, então mesmo que o Supabase Auth não funcione perfeitamente, o sistema continua a funcionar.

---

## 🔄 Alternativa: Não Usar Supabase Auth

Se preferir não usar o Supabase Auth de todo, pode remover a chamada `signUp()` e trabalhar apenas com a tabela `usuarios`. Mas isso requer mais mudanças no código.

**Recomendação:** Desative apenas a confirmação de email no dashboard do Supabase (mais simples).

---

## ✅ Verificação

Após desativar:
1. Teste criar uma conta Premium
2. Verifique que **não recebe email** de confirmação
3. A conta deve ser criada normalmente
