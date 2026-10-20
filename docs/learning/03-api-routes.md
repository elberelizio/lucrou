# O que são API Routes?

## Em linguagem simples

Imagina que o teu restaurante tem:
- A sala (o browser — o que o cliente vê)
- A cozinha (o servidor — onde o trabalho real acontece)

Os clientes NÃO entram na cozinha directamente.
Fazem o pedido ao empregado → o empregado vai à cozinha → traz o resultado.

As API routes são esse "empregado" — intermediários seguros entre o browser e a base de dados.

## No Next.js App Router

Ficheiros dentro de app/api/ com o nome route.ts são API routes.

Exemplos:
  app/api/auth/me/route.ts       → responde a GET /api/auth/me
  app/api/calculos/route.ts      → responde a GET e POST /api/calculos
  app/api/admin/route.ts         → responde a GET e POST /api/admin

## Como funciona uma API route

```
Browser                    Servidor (API route)              Base de dados
  |                               |                                |
  |-- fetch('/api/calculos') ---> |                                |
  |   (com token de autenticação) |                                |
  |                               |-- verificar token              |
  |                               |-- validar dados                |
  |                               |-- supabaseAdmin.insert() ----> |
  |                               |                          <---- |
  |<-- { success: true } ---------|                                |
```

## Por que é mais seguro?

Sem API routes:
  Browser → anon key → Supabase directamente
  Problema: qualquer pessoa pode modificar o pedido no browser

Com API routes:
  Browser → servidor → supabaseAdmin → Supabase
  O servidor verifica TUDO antes de tocar na base de dados

## Os métodos HTTP

GET    → buscar dados (ler)
POST   → criar dados (escrever)
PUT    → substituir dados (actualizar tudo)
PATCH  → actualizar parte dos dados
DELETE → apagar dados

## O que é um token de autenticação?

Quando o utilizador faz login, o Supabase gera um token JWT.
É como um bilhete de identidade digital — prova que o utilizador é quem diz ser.

O browser envia este token em cada pedido:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5...

O servidor verifica o token → sabe exactamente quem está a pedir.

## Estrutura de pastas que vamos criar

app/
  api/
    auth/
      me/route.ts           ← quem sou eu? (dados do utilizador)
      register/route.ts     ← criar conta premium
      ativar-codigo/route.ts ← activar código M-Pesa
    calculos/
      route.ts              ← listar e guardar cálculos
      count/route.ts        ← contar cálculos
    admin/
      route.ts              ← painel de administração
    stock/
      movimento/route.ts    ← entradas e saídas de stock
    resumo-mensal/
      route.ts              ← resumo de lucro do mês
