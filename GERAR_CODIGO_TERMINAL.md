# 💻 Gerar Códigos via Terminal

## 🚀 Método Rápido (Recomendado)

Use o script que já está configurado no projeto:

```bash
npm run gerar:codigo
```

**Pronto!** O código será gerado e mostrado no terminal.

---

## 📋 Pré-requisitos

Antes de usar, certifique-se de que:

1. ✅ Ficheiro `.env.local` existe na raiz do projeto
2. ✅ Tem estas variáveis configuradas:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key-aqui
   ```

**⚠️ IMPORTANTE:** Precisa da `SUPABASE_SERVICE_ROLE_KEY` (não a anon key!)

---

## 🔍 Como Obter a Service Role Key

1. Aceda ao Supabase Dashboard: https://supabase.com/dashboard
2. Selecione o seu projeto
3. Vá para **Settings** → **API**
4. Procure por **"service_role"** key (não a anon!)
5. Copie a chave completa
6. Adicione ao `.env.local`:
   ```
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

**⚠️ SEGURANÇA:** Esta chave dá acesso total à base de dados. NUNCA a partilhe ou faça commit!

---

## 📝 Exemplo de Uso

### 1. Configurar `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. Executar Script

```bash
npm run gerar:codigo
```

### 3. Resultado Esperado

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Código de ativação criado com sucesso!

📋 Código: ABC123XY
📅 Expira em: 20/03/2026

💡 Envie este código ao cliente após receber o pagamento M-Pesa
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🔧 Método Alternativo: Node.js Direto

Se preferir executar diretamente:

```bash
node scripts/gerar-codigo.js
```

---

## 🐛 Troubleshooting

### Erro: "Variáveis de ambiente não encontradas"

**Solução:**
1. Verifique se `.env.local` existe na raiz do projeto
2. Verifique se tem `SUPABASE_SERVICE_ROLE_KEY` (não `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`)
3. Reinicie o terminal após adicionar variáveis

### Erro: "Erro ao criar código"

**Solução:**
1. Verifique se a tabela `codigos_ativacao` existe no Supabase
2. Verifique se executou `supabase_codigos_ativacao.sql`
3. Verifique se a service_role key está correta

### Erro: "Cannot find module"

**Solução:**
```bash
npm install
```

---

## 📊 Comparação: Terminal vs Página Admin

| Característica | Terminal | Página Admin |
|---------------|----------|--------------|
| **Velocidade** | ⚡ Muito rápido | 🐢 Mais lento |
| **Associar a utilizador** | ❌ Não | ✅ Sim |
| **Ver pedidos pendentes** | ❌ Não | ✅ Sim |
| **Precisa navegador** | ❌ Não | ✅ Sim |
| **Precisa internet** | ✅ Sim | ✅ Sim |

**Recomendação:** Use terminal para códigos genéricos, página admin para códigos específicos.

---

## 💡 Dicas

- **Guarde os códigos gerados** num ficheiro ou documento
- **Cada código expira em 7 dias** se não usado
- **Códigos são únicos** - não podem ser duplicados
- **Use a página admin** se quiser associar código a um utilizador específico

---

## ✅ Checklist

Antes de gerar código via terminal:

- [ ] `.env.local` configurado
- [ ] `SUPABASE_SERVICE_ROLE_KEY` adicionada
- [ ] Tabela `codigos_ativacao` existe no Supabase
- [ ] Terminal na pasta raiz do projeto
- [ ] Dependências instaladas (`npm install`)

---

**Pronto para usar!** Execute `npm run gerar:codigo` e gere códigos rapidamente! 🚀
