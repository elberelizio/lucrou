# Como Gerar Códigos em Produção

Quando a aplicação estiver em produção no Vercel, você tem **3 opções** para gerar códigos de ativação:

---

## 🎯 Opção 1: Página Secreta na Aplicação (RECOMENDADO)

A forma mais fácil e rápida - diretamente no navegador!

**⚠️ SEGURANÇA:** A URL é secreta e não aparece em nenhum lugar. Apenas você sabe a URL.

### Como usar:

1. **Aceda à página secreta:**
   ```
   https://sua-url-vercel.vercel.app/_secret_xyz789
   ```
   
   **⚠️ IMPORTANTE:** Esta URL é SECRETA. Não partilhe com ninguém!

2. **Digite a senha admin** (configure no Vercel - ver abaixo)

3. **Clique em "Gerar Novo Código"**

4. **Copie o código gerado** e envie ao cliente

### Configurar senha admin no Vercel:

1. No dashboard do Vercel, vá para **Settings** → **Environment Variables**
2. Adicione:
   ```
   ADMIN_PASSWORD=sua_senha_segura_aqui
   ```
3. Faça redeploy

**⚠️ IMPORTANTE:** 
- Configure uma senha forte no Vercel
- A URL `/_secret_xyz789` é secreta e não aparece em menus ou links
- A página está bloqueada de indexação pelos motores de busca
- Após 5 tentativas falhadas, o acesso é bloqueado por 5 minutos

---

## 💻 Opção 2: Script Local (Sempre Funciona)

Mesmo em produção, você pode usar o script localmente apontando para a base de dados de produção.

### Passos:

1. **No seu computador**, abra o terminal no diretório do projeto

2. **Configure o `.env.local`** com as credenciais de produção:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
   ```

3. **Execute o script:**
   ```bash
   npm run gerar:codigo
   ```

4. **Copie o código gerado** e envie ao cliente

**Nota:** O script funciona mesmo que a aplicação esteja em produção porque conecta diretamente ao Supabase.

---

## 🗄️ Opção 3: SQL Editor do Supabase (Sempre Disponível)

A forma mais direta - sem precisar de código.

### Passos:

1. **Aceda ao Supabase Dashboard:** https://supabase.com/dashboard
2. **Selecione o seu projeto**
3. **Vá para SQL Editor**
4. **Execute este SQL:**

```sql
-- Gerar código manualmente
INSERT INTO codigos_ativacao (codigo, expira_em)
VALUES ('ABC123XY', NOW() + INTERVAL '7 days');
```

**Substitua `ABC123XY`** por um código único de 8 caracteres (letras maiúsculas e números, sem I, O, 0, 1).

5. **Clique em "Run"**
6. **Copie o código** e envie ao cliente

---

## 📊 Verificar Códigos Gerados

### Ver códigos disponíveis (não usados):

No SQL Editor do Supabase:

```sql
SELECT codigo, criado_em, expira_em
FROM codigos_ativacao
WHERE usado = FALSE
ORDER BY criado_em DESC;
```

### Ver códigos já usados:

```sql
SELECT codigo, usado_em, u.email, u.nome
FROM codigos_ativacao c
LEFT JOIN usuarios u ON c.usuario_id = u.id
WHERE usado = TRUE
ORDER BY usado_em DESC;
```

---

## 🔒 Segurança

### Para a Opção 1 (Página Secreta):

- ✅ URL secreta: `/_secret_xyz789` (não aparece em menus, links ou sitemaps)
- ✅ Bloqueada de indexação (robots.txt + headers)
- ✅ Proteção contra força bruta (bloqueio após 5 tentativas)
- ✅ Configure senha forte no Vercel (`ADMIN_PASSWORD`)
- ✅ Se senha não configurada, página mostra 404
- ✅ Nenhuma referência à palavra "admin" no código visível

### Para a Opção 2 (Script Local):

- ✅ Mantenha o `.env.local` seguro no seu computador
- ✅ Nunca commite o `.env.local` no Git
- ✅ Use apenas localmente

### Para a Opção 3 (SQL Editor):

- ✅ Use apenas se tiver acesso ao Supabase Dashboard
- ✅ Códigos são validados automaticamente pelo sistema

---

## 🎯 Recomendação

**Use a Opção 1 (Página Admin)** porque:
- ✅ Mais rápido e conveniente
- ✅ Funciona em qualquer dispositivo com navegador
- ✅ Não precisa de terminal ou SQL
- ✅ Interface visual amigável

**Tenha a Opção 2 (Script)** como backup caso a página admin não esteja disponível.

**Use a Opção 3 (SQL)** apenas em emergências ou se preferir trabalhar diretamente com SQL.

---

## 📝 Exemplo de Fluxo Completo

1. **Cliente paga 50 MT via M-Pesa** → Você recebe notificação
2. **Você acede:** `https://sua-url.vercel.app/_secret_xyz789` (URL secreta)
3. **Digite a senha admin**
4. **Clique em "Gerar Novo Código"**
5. **Copie o código** (ex: `ABC123XY`)
6. **Envie ao cliente** via SMS/WhatsApp: "Seu código de ativação: ABC123XY"
7. **Cliente insere código** na página `/ativar`
8. **Sistema ativa Premium por 30 dias** automaticamente

---

## ⚙️ Configuração Inicial no Vercel

Antes de usar a página admin em produção:

1. Vá para **Vercel Dashboard** → **Settings** → **Environment Variables**
2. Adicione:
   ```
   ADMIN_PASSWORD=sua_senha_segura_123
   ```
3. Marque para **Production**, **Preview** e **Development**
4. Faça **Redeploy**

Depois disso, a página `/_secret_xyz789` estará protegida pela senha que configurou.

**🔒 Segurança Adicional:**
- A URL `/_secret_xyz789` não aparece em nenhum menu ou link
- Está bloqueada no `robots.txt` (motores de busca não indexam)
- Headers HTTP bloqueiam indexação
- Após 5 tentativas falhadas, bloqueio temporário de 5 minutos
- Se senha não configurada, página mostra 404 (parece não existir)
