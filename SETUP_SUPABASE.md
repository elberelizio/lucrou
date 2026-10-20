# Setup Supabase - Lucrou

## 1. Executar SQL no Supabase

1. Aceda ao dashboard do Supabase: https://supabase.com/dashboard
2. Selecione o seu projeto
3. Vá para **SQL Editor** no menu lateral
4. Abra o ficheiro `supabase_schema.sql` deste projeto
5. Copie todo o conteúdo SQL
6. Cole no SQL Editor do Supabase
7. Clique em **Run** para executar

Isto criará:
- Tabela `usuarios` com campos para email, nome, nome_negocio, plano
- Tabela `calculos` com todos os campos individuais para analytics
- Tabela `pagamentos` para gestão de pagamentos M-Pesa
- Índices para melhor performance
- Políticas RLS (Row Level Security) para permitir leitura/escrita pública

## 2. Variáveis de Ambiente

O ficheiro `.env.local` já está configurado com:
- `NEXT_PUBLIC_SUPABASE_URL`: URL do seu projeto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Chave anónima do Supabase

**Importante:** As variáveis com prefixo `NEXT_PUBLIC_` são expostas ao cliente e podem ser acedidas no browser.

## 3. Fluxo de Autenticação

### Plano Gratuito
- Utilizador insere apenas email
- Sistema cria registo na tabela `usuarios` automaticamente
- Limite de 10 cálculos guardados
- Não requer senha

### Upgrade para Premium
- Utilizador preenche formulário completo (nome, nome_negocio, email, senha)
- Sistema cria conta no Supabase Auth
- Plano fica como `pendente_premium` até confirmação manual de pagamento
- Após confirmação, admin atualiza plano para `premium`

## 4. Estrutura de Dados

### Tabela usuarios
- `id`: UUID (chave primária)
- `email`: TEXT (único, obrigatório)
- `nome`: TEXT (opcional)
- `nome_negocio`: TEXT (opcional)
- `plano`: TEXT ('gratuito', 'premium', 'pendente_premium')
- `criado_em`: TIMESTAMP
- `ultimo_acesso`: TIMESTAMP

### Tabela calculos
Todos os campos são guardados individualmente (não em JSON) para analytics:
- `id`: UUID
- `usuario_id`: UUID (referência a usuarios)
- `email_usuario`: TEXT
- `nome_produto`: TEXT
- `unidades`: INTEGER
- `preco_compra`: NUMERIC
- `custo_transporte`: NUMERIC
- `outros_custos`: NUMERIC
- `lucro_percent`: NUMERIC
- `preco_recomendado`: NUMERIC
- `lucro_por_unidade`: NUMERIC
- `lucro_total`: NUMERIC
- `modo`: TEXT ('modoA' ou 'modoB')
- `criado_em`: TIMESTAMP

### Tabela pagamentos
- `id`: UUID
- `usuario_id`: UUID (referência a usuarios)
- `valor`: NUMERIC (default 50)
- `referencia_mpesa`: TEXT
- `estado`: TEXT ('pendente', 'confirmado', 'cancelado')
- `criado_em`: TIMESTAMP

## 5. Limites

- **Plano Gratuito**: 10 cálculos guardados
- **Plano Premium**: Histórico ilimitado

## 6. Próximos Passos

1. Executar o SQL no Supabase
2. Reiniciar o servidor Next.js para carregar as novas variáveis de ambiente
3. Testar o fluxo de autenticação:
   - Guardar cálculo sem estar autenticado (deve pedir email)
   - Guardar 10 cálculos (deve mostrar banner de upgrade)
   - Criar conta Premium
4. Configurar confirmação manual de pagamentos (backend/admin)
