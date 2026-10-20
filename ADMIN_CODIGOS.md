# Gestão de Códigos de Ativação M-Pesa

## Como Funciona

1. **Cliente paga via M-Pesa** → Você recebe o pagamento
2. **Você gera um código único** → Insere na base de dados
3. **Cliente insere código** → Sistema valida e ativa Premium por 30 dias
4. **Código usado uma vez** → Não pode ser reutilizado
5. **Após 30 dias** → Sistema reverte automaticamente para gratuito

## Gerar Código de Ativação

### Opção 1: Via SQL Editor do Supabase

```sql
INSERT INTO codigos_ativacao (codigo, expira_em)
VALUES ('ABC123XYZ', NOW() + INTERVAL '7 days');
```

### Opção 2: Via Script Node.js

Crie um script para gerar códigos automaticamente:

```javascript
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Gerar código aleatório
function gerarCodigo() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sem I, O, 0, 1
  let codigo = '';
  for (let i = 0; i < 8; i++) {
    codigo += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return codigo;
}

async function criarCodigo() {
  const codigo = gerarCodigo();
  const { data, error } = await supabase
    .from('codigos_ativacao')
    .insert([{
      codigo,
      expira_em: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 dias
    }])
    .select()
    .single();

  if (error) {
    console.error('Erro:', error);
  } else {
    console.log(`✅ Código criado: ${codigo}`);
  }
}

criarCodigo();
```

## Verificar Códigos Disponíveis

```sql
-- Ver códigos não usados
SELECT codigo, criado_em, expira_em
FROM codigos_ativacao
WHERE usado = FALSE
ORDER BY criado_em DESC;
```

## Verificar Códigos Usados

```sql
-- Ver códigos já utilizados
SELECT codigo, usuario_id, usado_em, u.email
FROM codigos_ativacao c
LEFT JOIN usuarios u ON c.usuario_id = u.id
WHERE usado = TRUE
ORDER BY usado_em DESC;
```

## Verificar Expirações Diariamente

### Configurar Cron Job (Linux/Mac)

Adicione ao crontab (`crontab -e`):

```bash
# Verificar expirações todos os dias às 00:00
0 0 * * * cd /caminho/para/projeto && npm run check:expirations
```

### Windows Task Scheduler

1. Abra Task Scheduler
2. Criar tarefa básica
3. Trigger: Diariamente às 00:00
4. Ação: Executar programa
5. Programa: `node`
6. Argumentos: `scripts/verificar-expiracoes.js`
7. Diretório: Caminho do projeto

### Executar Manualmente

```bash
npm run check:expirations
```

## Ver Utilizadores Premium Activos

```sql
SELECT 
  u.email,
  u.nome,
  u.nome_negocio,
  u.premium_valido_ate,
  u.premium_valido_ate - NOW() as dias_restantes
FROM usuarios u
WHERE u.plano = 'premium'
  AND u.premium_valido_ate > NOW()
ORDER BY u.premium_valido_ate ASC;
```

## Ver Utilizadores com Premium Expirado

```sql
SELECT 
  u.email,
  u.nome,
  u.premium_valido_ate
FROM usuarios u
WHERE u.plano = 'premium'
  AND u.premium_valido_ate < NOW();
```

## Estrutura da Tabela codigos_ativacao

- `id`: UUID (chave primária)
- `codigo`: TEXT (único, código de ativação)
- `usuario_id`: UUID (referência ao utilizador que usou)
- `usado`: BOOLEAN (se já foi utilizado)
- `usado_em`: TIMESTAMP (quando foi usado)
- `criado_em`: TIMESTAMP (quando foi criado)
- `expira_em`: TIMESTAMP (quando expira se não usado)

## Segurança

- Códigos são únicos (constraint UNIQUE)
- Código só pode ser usado uma vez
- Código pode expirar se não usado em X dias
- Função RPC garante validação atómica
