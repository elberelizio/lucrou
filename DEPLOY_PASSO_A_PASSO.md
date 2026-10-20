# 🚀 Deploy no Vercel - Passo a Passo Completo

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter:
- ✅ Conta no Vercel (crie em https://vercel.com/signup)
- ✅ Conta no Supabase (crie em https://supabase.com)
- ✅ Projeto no GitLab/GitHub (já temos: https://gitlab.com/elber_cumabane/lucrou.git)
- ✅ SQL executado no Supabase (supabase_schema.sql + supabase_codigos_ativacao.sql)

---

## PASSO 1: Preparar o Supabase

### 1.1. Criar projeto no Supabase

1. Aceda a: https://supabase.com/dashboard
2. Clique em **"New Project"**
3. Preencha:
   - **Name**: `lucrou` (ou outro nome)
   - **Database Password**: Crie uma senha forte (guarde bem!)
   - **Region**: Escolha a região mais próxima
4. Clique em **"Create new project"**
5. Aguarde 2-3 minutos até o projeto estar pronto

### 1.2. Executar SQL no Supabase

1. No Supabase Dashboard, vá para **SQL Editor** (menu lateral)
2. Abra o ficheiro `supabase_schema.sql` do projeto
3. **Copie TODO o conteúdo** do ficheiro
4. Cole no SQL Editor do Supabase
5. Clique em **"Run"** ou pressione `Ctrl+Enter`
6. Aguarde confirmação: "Success. No rows returned"

7. **Repita para o segundo ficheiro:**
   - Abra `supabase_codigos_ativacao.sql`
   - Copie TODO o conteúdo
   - Cole no SQL Editor
   - Clique em **"Run"**

### 1.3. Obter credenciais do Supabase

1. No Supabase Dashboard, vá para **Settings** → **API**
2. Copie estas informações (vai precisar depois):
   - **Project URL**: `https://hweqylouzvvaixeabeee.supabase.co`
   - **anon public** key: `sb_publishable_sgejAKhp3v3dGtrv1rILMg_rIhsHQxQ`

**⚠️ IMPORTANTE:** Use a chave **anon** (pública), NÃO a **service_role** (privada)

**✅ Dados já confirmados:** As credenciais acima estão corretas e prontas para usar!

---

## PASSO 2: Fazer Deploy no Vercel

### 2.1. Criar conta no Vercel

1. Aceda a: https://vercel.com/signup
2. Escolha **"Continue with GitLab"** (ou GitHub/Bitbucket)
3. Autorize o Vercel a aceder ao seu GitLab

### 2.2. Importar projeto

1. No dashboard do Vercel, clique em **"Add New Project"**
2. Selecione o repositório: `elber_cumabane/lucrou`
3. Clique em **"Import"**

### 2.3. Configurar projeto

O Vercel detecta automaticamente que é Next.js. Verifique:

- **Framework Preset**: `Next.js` ✅
- **Root Directory**: `./` ✅
- **Build Command**: `npm run build` ✅
- **Output Directory**: `.next` ✅
- **Install Command**: `npm install` ✅

**NÃO clique em "Deploy" ainda!** Primeiro precisa configurar as variáveis.

---

## PASSO 3: Configurar Variáveis de Ambiente

### 3.1. Adicionar variáveis do Supabase

Na página de configuração do projeto, vá para a secção **"Environment Variables"**:

1. Clique em **"Add"** para adicionar variável
2. Adicione a primeira variável:
   ```
   Name: NEXT_PUBLIC_SUPABASE_URL
   Value: https://hweqylouzvvaixeabeee.supabase.co
   ```
   - Marque: ✅ Production, ✅ Preview, ✅ Development

3. Clique em **"Add"** novamente para a segunda variável:
   ```
   Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
   Value: sb_publishable_sgejAKhp3v3dGtrv1rILMg_rIhsHQxQ
   ```
   - Marque: ✅ Production, ✅ Preview, ✅ Development

4. Clique em **"Add"** para a terceira variável (senha admin):
   ```
   Name: ADMIN_PASSWORD
   Value: sua_senha_forte_aqui_123
   ```
   - Marque: ✅ Production, ✅ Preview, ✅ Development
   
   **⚠️ IMPORTANTE:** Substitua `sua_senha_forte_aqui_123` por uma senha forte de sua escolha!

**⚠️ IMPORTANTE:** 
- Substitua `sua_senha_forte_aqui_123` por uma senha forte de sua escolha
- Esta senha dá acesso à página secreta `/_secret_xyz789`

### 3.2. Verificar variáveis

Deve ter 3 variáveis configuradas:
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `ADMIN_PASSWORD` (sem NEXT_PUBLIC_)

---

## PASSO 4: Fazer Deploy

### 4.1. Iniciar deploy

1. Clique em **"Deploy"** (botão no final da página)
2. Aguarde o build (pode demorar 2-5 minutos)
3. Veja o progresso em tempo real:
   - Installing dependencies...
   - Building...
   - Generating static pages...

### 4.2. Verificar se build foi bem-sucedido

Se aparecer ✅ **"Build Successful"**, está tudo certo!

Se aparecer ❌ erro:
- Verifique os logs de build
- Certifique-se de que todas as variáveis estão configuradas
- Verifique se o SQL foi executado no Supabase

---

## PASSO 5: Verificar Deploy

### 5.1. Aceder à aplicação

Após o deploy bem-sucedido:

1. O Vercel mostra a URL: `https://lucrou-xxxxx.vercel.app`
2. Clique na URL ou copie-a
3. Abra no navegador

### 5.2. Testar funcionalidades

1. **Página inicial**: Deve carregar normalmente
2. **Criar cálculo**: Teste fazer um cálculo
3. **Guardar produto**: Teste guardar um produto
4. **Página secreta**: Aceda a `/_secret_xyz789` e teste gerar código

### 5.3. Verificar base de dados

1. No Supabase Dashboard, vá para **Table Editor**
2. Verifique se aparecem dados quando guarda algo na aplicação
3. Teste gerar um código na página secreta e verifique se aparece na tabela `codigos_ativacao`

---

## PASSO 6: Configurar Domínio Personalizado (Opcional)

### 6.1. Adicionar domínio

1. No Vercel Dashboard, vá para **Settings** → **Domains**
2. Clique em **"Add Domain"**
3. Digite o seu domínio (ex: `lucrou.com`)
4. Siga as instruções para configurar DNS

### 6.2. Configurar DNS

O Vercel fornece instruções específicas. Normalmente precisa:
- Adicionar um registo `A` ou `CNAME`
- Aguardar propagação DNS (pode demorar até 24h)

---

## PASSO 7: Configurar Domínio Personalizado (Opcional)

### 7.1. Aceder à página secreta

1. Aceda a: `https://sua-url.vercel.app/_secret_xyz789`
2. Digite a senha que configurou em `ADMIN_PASSWORD`
3. Clique em **"Gerar Novo Código"**
4. Copie o código gerado

### 7.2. Testar ativação de código

1. Na aplicação, vá para `/ativar`
2. Insira o código gerado
3. Verifique se ativa o Premium corretamente

---

## ✅ Checklist Final

Antes de considerar o deploy completo, verifique:

- [ ] Projeto Supabase criado e ativo
- [ ] SQL executado (supabase_schema.sql + supabase_codigos_ativacao.sql)
- [ ] Variáveis de ambiente configuradas no Vercel:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `ADMIN_PASSWORD`
- [ ] Deploy bem-sucedido (✅ Build Successful)
- [ ] Aplicação acessível na URL do Vercel
- [ ] Testes funcionais:
  - [ ] Criar cálculo funciona
  - [ ] Guardar produto funciona
  - [ ] Gerar código na página secreta funciona
  - [ ] Ativar código funciona
- [ ] Dados aparecem no Supabase quando guarda algo

---

## 🐛 Troubleshooting

### Problema: "Build Failed"

**Solução:**
1. Verifique os logs de build no Vercel
2. Certifique-se de que todas as dependências estão no `package.json`
3. Verifique se há erros de TypeScript

### Problema: "Missing Supabase environment variables"

**Solução:**
1. Vá para Settings → Environment Variables
2. Verifique se as variáveis estão escritas corretamente:
   - `NEXT_PUBLIC_SUPABASE_URL` (não `SUPABASE_URL`)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (não `SUPABASE_ANON_KEY`)
3. Faça redeploy após adicionar variáveis

### Problema: "Failed to fetch" ou erros de conexão

**Solução:**
1. Verifique se a URL do Supabase está correta
2. Verifique se o projeto Supabase está ativo
3. Verifique as políticas RLS no Supabase (devem permitir leitura/escrita)

### Problema: Página secreta mostra 404

**Solução:**
1. Verifique se `ADMIN_PASSWORD` está configurada no Vercel
2. Faça redeploy após adicionar a variável
3. Certifique-se de que a URL está correta: `/_secret_xyz789`

---

## 📝 Notas Importantes

1. **Primeiro deploy pode demorar 3-5 minutos**
2. **Deploys seguintes são mais rápidos** (apenas quando há mudanças)
3. **Cada commit no GitLab pode triggerar novo deploy** (se configurado)
4. **Variáveis de ambiente são aplicadas apenas após redeploy**

---

## 🎯 Resumo Rápido

1. ✅ Criar projeto Supabase
2. ✅ Executar SQL no Supabase
3. ✅ Obter credenciais (URL + anon key)
4. ✅ Criar conta Vercel
5. ✅ Importar projeto do GitLab
6. ✅ Configurar variáveis de ambiente
7. ✅ Fazer deploy
8. ✅ Testar aplicação
9. ✅ Configurar domínio (opcional)

---

## 🔗 Links Úteis

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Documentação Vercel**: https://vercel.com/docs
- **Documentação Supabase**: https://supabase.com/docs

---

**Pronto!** Após seguir estes passos, a sua aplicação estará em produção! 🎉
