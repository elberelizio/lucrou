# 🧪 Guia de Teste Local - Página Admin

## 📋 Pré-requisitos

Antes de testar, certifique-se de que:
- ✅ Servidor Next.js está a correr (`npm run dev`)
- ✅ Base de dados Supabase está configurada
- ✅ SQL executado (`supabase_schema.sql` + `supabase_codigos_ativacao.sql`)
- ✅ Variáveis de ambiente configuradas no `.env.local`

---

## 🚀 Passo 1: Iniciar Servidor

```bash
npm run dev
```

Aguarde até ver:
```
▲ Next.js 16.1.6
- Local:        http://localhost:3000
- Network:      http://192.168.X.X:3000
```

---

## 🔐 Passo 2: Configurar Senha Admin

1. Abra o ficheiro `.env.local`
2. Adicione ou verifique:
   ```
   ADMIN_PASSWORD=sua_senha_teste_123
   ```
3. **Reinicie o servidor** (Ctrl+C e depois `npm run dev` novamente)

---

## 📝 Passo 3: Criar Conta Premium de Teste

### Opção A: Via Interface (Recomendado)

1. Abra `http://localhost:3000` no navegador
2. Faça um cálculo qualquer
3. Guarde o cálculo (vai pedir email)
4. Digite um email de teste (ex: `teste@exemplo.com`)
5. Guarde mais alguns cálculos até aparecer o banner de upgrade
6. Clique em "Upgrade para Premium"
7. Preencha o formulário:
   - Nome: `Teste Admin`
   - Nome do negócio: `Loja Teste`
   - Email: (já preenchido automaticamente)
   - Senha: `senha123`
   - Confirmar senha: `senha123`
8. Clique em "Criar conta Premium"

**Resultado esperado:** Conta criada com sucesso, plano fica como "Pendente"

### Opção B: Via SQL (Mais Rápido)

1. Aceda ao Supabase Dashboard → SQL Editor
2. Execute:
   ```sql
   -- Criar utilizador de teste
   INSERT INTO usuarios (email, nome, nome_negocio, plano)
   VALUES ('teste@exemplo.com', 'Teste Admin', 'Loja Teste', 'pendente_premium')
   ON CONFLICT (email) DO UPDATE SET plano = 'pendente_premium';
   
   -- Criar pagamento pendente
   INSERT INTO pagamentos (usuario_id, valor, estado)
   SELECT id, 50, 'pendente'
   FROM usuarios
   WHERE email = 'teste@exemplo.com';
   ```

---

## 🔓 Passo 4: Aceder à Página Admin

1. No navegador, aceda a:
   ```
   http://localhost:3000/_secret_xyz789
   ```
2. Digite a senha que configurou no `.env.local`
3. Clique em "Entrar"

**Resultado esperado:** Deve ver a página admin com:
- Lista de "Pedidos Premium Pendentes" (com o utilizador de teste)
- Botão "Gerar Código Genérico"

---

## ✅ Passo 5: Testar Funcionalidades

### Teste 1: Ver Lista de Pedidos Pendentes

**O que verificar:**
- ✅ Lista mostra o utilizador de teste
- ✅ Mostra nome, email, nome do negócio
- ✅ Mostra data do pedido
- ✅ Botão "Gerar Código" aparece ao lado

### Teste 2: Gerar Código para Utilizador Específico

1. Clique em "Gerar Código" ao lado do utilizador de teste
2. **Resultado esperado:**
   - Código aparece em destaque (ex: `ABC123XY`)
   - Mostra data de expiração
   - Botão "Copiar Código" funciona
   - Lista de pedidos recarrega

### Teste 3: Verificar Código no Supabase

1. Aceda ao Supabase Dashboard → Table Editor → `codigos_ativacao`
2. **Verificar:**
   - ✅ Código foi criado
   - ✅ Campo `usuario_id` está preenchido (associado ao utilizador)
   - ✅ Campo `expira_em` tem data futura (7 dias)
   - ✅ Campo `usado` está como `false`

### Teste 4: Gerar Código Genérico

1. Clique em "Gerar Código Genérico"
2. **Resultado esperado:**
   - Código é gerado
   - Código NÃO está associado a nenhum utilizador (`usuario_id` = null)

### Teste 5: Testar Ativação do Código

1. Abra uma nova aba/janela (ou use modo anónimo)
2. Aceda a `http://localhost:3000/ativar`
3. Faça login com o email de teste (`teste@exemplo.com`)
4. Digite o código gerado
5. Clique em "Activar Premium"
6. **Resultado esperado:**
   - ✅ Código é aceite
   - ✅ Plano muda para "Premium"
   - ✅ Código fica marcado como usado no Supabase

---

## 🐛 Troubleshooting

### Problema: "Acesso não configurado" ou página 404

**Solução:**
- Verifique se `ADMIN_PASSWORD` está no `.env.local`
- Reinicie o servidor após adicionar a variável

### Problema: Lista de pedidos vazia

**Solução:**
- Verifique se criou utilizador com plano `pendente_premium`
- Verifique no Supabase se o utilizador existe:
  ```sql
  SELECT * FROM usuarios WHERE plano = 'pendente_premium';
  ```

### Problema: Erro ao gerar código

**Solução:**
- Verifique se a tabela `codigos_ativacao` existe no Supabase
- Verifique se executou `supabase_codigos_ativacao.sql`

### Problema: Código não ativa Premium

**Solução:**
- Verifique se a função `ativar_codigo_premium` existe no Supabase
- Verifique se o código está correto (maiúsculas)
- Verifique se o código não expirou

---

## 📊 Checklist de Teste

Marque cada item após testar:

- [ ] Servidor inicia sem erros
- [ ] Senha admin funciona na página `/_secret_xyz789`
- [ ] Lista de pedidos pendentes aparece
- [ ] Informações do utilizador estão corretas
- [ ] Botão "Gerar Código" funciona
- [ ] Código é gerado e copiado corretamente
- [ ] Código aparece no Supabase associado ao utilizador
- [ ] Código genérico funciona (sem utilizador)
- [ ] Código ativa Premium corretamente
- [ ] Após ativação, plano muda para "premium"
- [ ] Código fica marcado como usado

---

## 🎯 Teste Completo do Fluxo

1. ✅ Criar conta Premium (via formulário)
2. ✅ Ver pedido na lista admin
3. ✅ Gerar código para o pedido
4. ✅ Copiar código
5. ✅ Ativar código na página `/ativar`
6. ✅ Verificar que Premium está ativo
7. ✅ Verificar que código está usado no Supabase

---

## 💡 Dicas

- Use emails diferentes para cada teste
- Limpe dados de teste antes de fazer deploy
- Teste em diferentes navegadores
- Teste no celular também (usando IP da rede)

---

**Pronto para testar!** Siga os passos acima e verifique se tudo funciona corretamente antes do deploy. 🚀
