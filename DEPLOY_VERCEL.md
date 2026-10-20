# Deploy no Vercel - Guia de Configuração Supabase

## ✅ Resposta Rápida

**SIM, a base de dados Supabase estará conectada após configurar as variáveis de ambiente no Vercel.**

O Supabase é uma base de dados na cloud (independente do Vercel), e a conexão funciona através de variáveis de ambiente. Quando fizer deploy no Vercel, precisa apenas configurar as mesmas variáveis que usa localmente.

---

## 📋 Passo a Passo para Deploy

### 1. Preparar o Projeto Supabase

Certifique-se de que:
- ✅ Criou o projeto no Supabase (https://supabase.com/dashboard)
- ✅ Executou o SQL do `supabase_schema.sql` no SQL Editor do Supabase
- ✅ Tem as credenciais do Supabase:
  - **URL do projeto** (ex: `https://xxxxx.supabase.co`)
  - **Anon Key** (chave pública/anónima)

### 2. Fazer Deploy no Vercel

#### Opção A: Via Interface Web do Vercel

1. Aceda a https://vercel.com
2. Faça login com GitHub/GitLab/Bitbucket
3. Clique em **"Add New Project"**
4. Importe o repositório do seu projeto
5. Configure o projeto:
   - **Framework Preset**: Next.js (detectado automaticamente)
   - **Root Directory**: `./` (raiz do projeto)
   - **Build Command**: `npm run build` (automático)
   - **Output Directory**: `.next` (automático)

#### Opção B: Via CLI do Vercel

```bash
npm i -g vercel
vercel login
vercel
```

### 3. ⚠️ CONFIGURAR VARIÁVEIS DE AMBIENTE NO VERCEL

**Este é o passo mais importante!**

1. No dashboard do Vercel, vá para o seu projeto
2. Clique em **Settings** → **Environment Variables**
3. Adicione as seguintes variáveis:

```
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-aqui
```

**Como obter estas variáveis:**
1. Aceda ao Supabase Dashboard: https://supabase.com/dashboard
2. Selecione o seu projeto
3. Vá para **Settings** → **API**
4. Copie:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**⚠️ IMPORTANTE:**
- Use a chave **anon** (pública), NÃO a **service_role** (privada)
- A chave anon é segura para usar no frontend
- Marque as variáveis para **Production**, **Preview** e **Development**

### 4. Fazer Redeploy

Após adicionar as variáveis:
1. Vá para **Deployments**
2. Clique nos três pontos (⋯) do último deploy
3. Selecione **Redeploy**
4. Ou faça um novo commit para trigger automático

---

## 🔍 Como Verificar se Está Funcionando

Após o deploy:

1. Aceda à URL do seu projeto no Vercel
2. Abra o console do navegador (F12)
3. Tente criar um cálculo ou registar um utilizador
4. Verifique se os dados aparecem no Supabase Dashboard:
   - Vá para **Table Editor** no Supabase
   - Verifique as tabelas `usuarios` e `calculos`

---

## 🏗️ Como Funciona a Arquitetura

```
┌─────────────────┐         ┌──────────────────┐
│   Vercel        │         │   Supabase       │
│   (Frontend)    │────────▶│   (Backend/DB)   │
│                 │  HTTPS  │                  │
│ Next.js App     │         │ PostgreSQL DB    │
│                 │         │                  │
└─────────────────┘         └──────────────────┘
      │                              │
      │ Variáveis de Ambiente        │
      │ NEXT_PUBLIC_SUPABASE_URL     │
      │ NEXT_PUBLIC_SUPABASE_ANON_KEY│
      └──────────────────────────────┘
```

**Explicação:**
- O **Vercel** hospeda o frontend (Next.js)
- O **Supabase** hospeda a base de dados (PostgreSQL)
- A conexão é feita via HTTPS usando as variáveis de ambiente
- As variáveis `NEXT_PUBLIC_*` são expostas ao browser (seguro para chaves públicas)

---

## 🔒 Segurança

### ✅ O que está seguro:
- A chave **anon** do Supabase pode ser exposta no frontend
- O Supabase usa **Row Level Security (RLS)** para proteger dados
- As políticas RLS controlam quem pode ler/escrever dados

### ⚠️ O que NUNCA deve fazer:
- ❌ NUNCA exponha a **service_role** key no frontend
- ❌ NUNCA commite o ficheiro `.env.local` no Git
- ✅ Use apenas variáveis `NEXT_PUBLIC_*` no frontend

---

## 🐛 Troubleshooting

### Problema: "Missing Supabase environment variables"

**Solução:**
1. Verifique se as variáveis estão configuradas no Vercel
2. Certifique-se de que as variáveis têm o nome correto:
   - `NEXT_PUBLIC_SUPABASE_URL` (não `SUPABASE_URL`)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (não `SUPABASE_ANON_KEY`)
3. Faça um redeploy após adicionar as variáveis

### Problema: "Failed to fetch" ou erros de conexão

**Solução:**
1. Verifique se a URL do Supabase está correta
2. Verifique se o projeto Supabase está ativo
3. Verifique as políticas RLS no Supabase (devem permitir leitura/escrita)

### Problema: Dados não aparecem no Supabase

**Solução:**
1. Verifique se executou o SQL `supabase_schema.sql`
2. Verifique as políticas RLS nas tabelas
3. Verifique os logs do Vercel para erros

---

## 📝 Checklist Pré-Deploy

Antes de fazer deploy, certifique-se de:

- [ ] Projeto Supabase criado e ativo
- [ ] SQL `supabase_schema.sql` executado no Supabase
- [ ] Variáveis de ambiente configuradas no Vercel:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Testado localmente com `.env.local`
- [ ] Código commitado no Git
- [ ] Repositório conectado ao Vercel

---

## 🚀 Após o Deploy

1. **Teste a aplicação** na URL do Vercel
2. **Verifique os dados** no Supabase Dashboard
3. **Monitore os logs** no Vercel Dashboard
4. **Configure domínio personalizado** (opcional)

---

## 📚 Recursos Úteis

- [Documentação Vercel - Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Documentação Supabase - Getting Started](https://supabase.com/docs/guides/getting-started)
- [Documentação Supabase - Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

## 💡 Dica Final

O Supabase e o Vercel trabalham perfeitamente juntos. O Supabase é a base de dados na cloud, e o Vercel é apenas o servidor que hospeda o frontend. A conexão entre eles é feita através das variáveis de ambiente, exatamente como funciona localmente.

**Resumo:** Configure as variáveis no Vercel → Faça deploy → Funciona! 🎉
