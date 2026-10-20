# O que é RLS (Row Level Security)?

## Em linguagem simples

Imagina que tens um caderno partilhado por 100 pessoas.
Sem RLS, qualquer pessoa abre o caderno e lê tudo de todas as outras.
Com RLS, cada pessoa só consegue ler as suas próprias páginas.

## Como funciona no Supabase / PostgreSQL

O Supabase dá-te uma chave pública (anon key) que qualquer pessoa pode usar
para falar directamente com a base de dados.

Sem RLS → qualquer pessoa com a chave pública lê TUDO.
Com RLS → a base de dados verifica "quem és tu?" antes de mostrar os dados.

## As políticas que criámos

```sql
-- Exemplo: tabela calculos
CREATE POLICY "calculos_select_own" ON calculos
  FOR SELECT USING (
    auth.uid() = usuario_id OR auth.role() = 'service_role'
  );
```

Tradução: "Só podes VER um cálculo SE o teu ID de utilizador for igual ao usuario_id
desse cálculo. Ou se fores o servidor (service_role)."

## Dois tipos de acesso

1. ANON KEY (chave pública)
   → Usada no browser pelo utilizador
   → Sujeita às políticas RLS
   → Nunca deve ter acesso irrestrito

2. SERVICE ROLE KEY (chave do servidor)
   → Usada APENAS no servidor (API routes)
   → Bypassa o RLS completamente
   → NUNCA deve ir para o browser

## Conceitos-chave

- POLICY = regra de acesso para uma tabela
- FOR SELECT = regra para leitura
- FOR INSERT = regra para escrita
- FOR UPDATE = regra para editar
- FOR DELETE = regra para apagar
- USING = condição para leitura (quem pode VER)
- WITH CHECK = condição para escrita (quem pode ESCREVER)
- auth.uid() = o ID do utilizador autenticado no Supabase
- auth.role() = o tipo de acesso ('anon', 'authenticated', 'service_role')

## O que estava errado antes

Todas as políticas tinham USING (true) — ou seja, a condição era sempre verdadeira.
É como ter uma porta com fechadura mas a chave é "qualquer coisa serve".

## O que corrigimos

Substituímos USING (true) por condições reais:
- Utilizadores vêem só os seus próprios dados
- Só o servidor pode escrever (via API routes)
- Códigos de activação só acessíveis pelo servidor
